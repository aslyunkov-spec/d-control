from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Max, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from departments.models import Department, DepartmentColumn

from .models import Priority, Task, TaskAssignment, TaskComment, TaskFile, TaskStatus
from .serializers import (
    TaskCommentSerializer,
    TaskCreateSerializer,
    TaskDetailSerializer,
    TaskFileSerializer,
    TaskSerializer,
    TaskSubtaskCreateSerializer,
)


MANAGEMENT_ROLE_CODES = {"admin", "administrator", "director"}
DEPARTMENT_HEAD_ROLE_CODES = {
    "department_head",
    "department_lead",
    "head",
    "head_of_department",
    "manager",
    "department_manager",
    "supervisor",
}
MANAGEMENT_ROLE_NAMES = {"administrator", "director", "администратор", "директор"}
DEPARTMENT_HEAD_ROLE_NAMES = {
    "department head",
    "head of department",
    "руководитель",
    "руководитель отдела",
    "начальник отдела",
}


def can_manage_task_assignees(user, task):
    if user is None:
        return False

    if user.is_superuser or user.id == task.created_by_id:
        return True

    profile = getattr(user, "profile", None)
    role = getattr(profile, "role", None)
    if not role:
        return False

    role_code = (role.code or "").strip().lower()
    role_name = (role.name or "").strip().lower()
    if role_code in MANAGEMENT_ROLE_CODES or role_name in MANAGEMENT_ROLE_NAMES:
        return True

    return (
        role_code in DEPARTMENT_HEAD_ROLE_CODES
        or role_name in DEPARTMENT_HEAD_ROLE_NAMES
    ) and profile.department_id == task.department_id


class TaskListAPIView(ListAPIView):
    authentication_classes = ()
    serializer_class = TaskSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        queryset = (
            Task.objects.filter(parent_task__isnull=True)
            .select_related(
                "department",
                "status",
                "priority",
            )
            .prefetch_related(
                "subtasks__status",
                "subtasks__priority",
                "subtasks__department",
                "subtasks__assignments__user",
                "assignments__user__profile__role",
            )
            .annotate(
                comments_count=Count("comments", distinct=True),
                files_count=Count("files", distinct=True),
                subtasks_total=Count("subtasks", distinct=True),
                subtasks_completed=Count(
                    "subtasks",
                    filter=Q(subtasks__status__system_type__in=["completed", "archived"]),
                    distinct=True,
                ),
            )
            .order_by("column__sort_order", "-created_at")
        )

        department_id = self.request.query_params.get("department")
        if department_id:
            queryset = queryset.filter(department_id=department_id)

        return queryset

    def post(self, request):
        serializer = TaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        department = get_object_or_404(Department, pk=serializer.validated_data["department"])
        column = get_object_or_404(
            DepartmentColumn,
            pk=serializer.validated_data["column"],
            department=department,
        )
        status_obj = get_default_active_status()
        priority = get_default_priority()
        user = get_request_user_or_fallback(request)

        validation_error = get_task_creation_validation_error(status_obj, priority, user)
        if validation_error is not None:
            return validation_error

        sequence_number = get_next_task_sequence_number()
        task = Task.objects.create(
            department=department,
            column=column,
            status=status_obj,
            priority=priority,
            number=f"TASK-{sequence_number}",
            sequence_number=sequence_number,
            title=serializer.validated_data["title"],
            created_by=user,
        )

        output_serializer = TaskSerializer(task)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class TaskDetailAPIView(RetrieveAPIView):
    serializer_class = TaskDetailSerializer
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return Task.objects.select_related(
            "department",
            "status",
            "priority",
        ).prefetch_related(
            "assignments__user__profile__role",
            "comments__author__profile",
            "files__uploaded_by__profile",
            "history_events__user__profile",
            "subtasks__status",
            "subtasks__priority",
            "subtasks__department",
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["user"] = get_request_user_or_fallback(self.request)
        return context

    def patch(self, request, pk):
        task = get_object_or_404(self.get_queryset(), pk=pk)
        has_title = "title" in request.data
        assignment_fields = {
            "assignees": TaskAssignment.ASSIGNMENT_ASSIGNEE,
            "watchers": TaskAssignment.ASSIGNMENT_WATCHER,
        }
        requested_assignment_fields = [
            field_name
            for field_name in assignment_fields
            if field_name in request.data
        ]

        if not has_title and not requested_assignment_fields:
            return Response(
                {"detail": "Provide title, assignees, or watchers to update the task."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if has_title:
            title = str(request.data.get("title", "")).strip()
            if not title:
                return Response(
                    {"title": ["Task title cannot be empty."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            task.title = title
            task.save(update_fields=["title", "updated_at"])

        if requested_assignment_fields:
            user = get_request_user_or_fallback(request)
            if not can_manage_task_assignees(user, task):
                return Response(
                    {"detail": "You do not have permission to change task assignments."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            assignment_users = {}
            for field_name in requested_assignment_fields:
                users, error_response = get_assignment_users(request.data.get(field_name), field_name)
                if error_response is not None:
                    return error_response
                assignment_users[field_name] = users

            with transaction.atomic():
                for field_name, users in assignment_users.items():
                    sync_task_assignments(
                        task,
                        users,
                        assignment_fields[field_name],
                    )

        task = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = TaskDetailSerializer(task, context=self.get_serializer_context())
        return Response(serializer.data)


class TaskCommentCreateAPIView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        text = str(request.data.get("text", "")).strip()

        if not text:
            return Response(
                {"text": ["Комментарий не может быть пустым."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_request_user_or_fallback(request)
        if user is None:
            return Response(
                {"detail": "Не найден пользователь для создания комментария."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = TaskComment.objects.create(task=task, author=user, text=text)
        serializer = TaskCommentSerializer(comment, context={"user": user})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskCommentUpdateAPIView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def patch(self, request, pk, comment_pk):
        task = get_object_or_404(Task, pk=pk)
        comment = get_object_or_404(TaskComment, pk=comment_pk, task=task)
        user = get_request_user_or_fallback(request)
        if user is None:
            return Response(
                {"detail": "Не найден пользователь для редактирования комментария."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if comment.author_id != user.id:
            return Response(
                {"detail": "Можно редактировать только свои комментарии."},
                status=status.HTTP_403_FORBIDDEN,
            )

        text = str(request.data.get("text", "")).strip()
        if not text:
            return Response(
                {"text": ["Комментарий не может быть пустым."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment.text = text
        comment.save(update_fields=["text", "updated_at"])
        serializer = TaskCommentSerializer(comment, context={"user": user})
        return Response(serializer.data)


class TaskFileCreateAPIView(APIView):
    authentication_classes = ()
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = (AllowAny,)

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        uploaded_file = request.FILES.get("file")

        if uploaded_file is None:
            return Response(
                {"file": ["Файл обязателен."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_request_user_or_fallback(request)
        if user is None:
            return Response(
                {"detail": "Не найден пользователь для загрузки файла."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task_file = TaskFile.objects.create(
            task=task,
            uploaded_by=user,
            file=uploaded_file,
            original_name=uploaded_file.name,
        )
        serializer = TaskFileSerializer(task_file, context={"request": request, "user": user})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskFileDeleteAPIView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def delete(self, request, pk, file_pk):
        task = get_object_or_404(Task, pk=pk)
        task_file = get_object_or_404(TaskFile, pk=file_pk, task=task)
        user = get_request_user_or_fallback(request)
        if user is None:
            return Response(
                {"detail": "Не найден пользователь для удаления файла."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if task_file.uploaded_by_id != user.id:
            return Response(
                {"detail": "Можно удалять только свои файлы."},
                status=status.HTTP_403_FORBIDDEN,
            )

        task_file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskSubtaskCreateAPIView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def post(self, request, pk):
        parent_task = get_object_or_404(
            Task.objects.select_related("department", "column"),
            pk=pk,
        )
        serializer = TaskSubtaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        status_obj = get_default_active_status()
        priority = get_default_priority()
        user = get_request_user_or_fallback(request)

        validation_error = get_task_creation_validation_error(status_obj, priority, user)
        if validation_error is not None:
            return validation_error

        sequence_number = get_next_task_sequence_number()
        subtask = Task.objects.create(
            parent_task=parent_task,
            department=parent_task.department,
            column=parent_task.column,
            status=status_obj,
            priority=priority,
            number=f"TASK-{sequence_number}",
            sequence_number=sequence_number,
            title=serializer.validated_data["title"],
            created_by=user,
        )

        inherit_task_assignments(parent_task, subtask)

        output_serializer = TaskSerializer(subtask)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class TaskSubtaskToggleAPIView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def post(self, request, pk, subtask_pk):
        parent_task = get_object_or_404(Task, pk=pk)
        subtask = get_object_or_404(
            Task.objects.select_related("status", "created_by"),
            pk=subtask_pk,
            parent_task=parent_task,
        )
        if is_completed_or_archived(subtask.status):
            next_status = get_default_active_status()
        else:
            next_status = get_default_completed_status()

        if next_status is None:
            return Response(
                {"detail": "Не найден подходящий статус для переключения подзадачи."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subtask.status = next_status
        subtask.save(update_fields=["status"])

        output_serializer = TaskSerializer(subtask)
        return Response(output_serializer.data)


class TaskSubtaskDeleteAPIView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def delete(self, request, pk, subtask_pk):
        parent_task = get_object_or_404(Task, pk=pk)
        subtask = get_object_or_404(Task, pk=subtask_pk, parent_task=parent_task)
        subtask.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

def inherit_task_assignments(parent_task, subtask):
    parent_assignments = parent_task.assignments.filter(
        assignment_type=TaskAssignment.ASSIGNMENT_ASSIGNEE,
    ).select_related("user")
    TaskAssignment.objects.bulk_create(
        [
            TaskAssignment(
                task=subtask,
                user=assignment.user,
                status=TaskAssignment.STATUS_ASSIGNED,
                assignment_type=TaskAssignment.ASSIGNMENT_ASSIGNEE,
            )
            for assignment in parent_assignments
        ],
        ignore_conflicts=True,
    )
def is_completed_or_archived(status_obj):
    return status_obj.system_type in [TaskStatus.SYSTEM_COMPLETED, TaskStatus.SYSTEM_ARCHIVED]


def get_assignment_users(raw_user_ids, field_name):
    if not isinstance(raw_user_ids, list):
        return None, Response(
            {field_name: ["Expected a list of user ids."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        normalized_ids = {int(user_id) for user_id in raw_user_ids}
    except (TypeError, ValueError):
        return None, Response(
            {field_name: ["Every entry must be a valid user id."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    users = list(get_user_model().objects.filter(id__in=normalized_ids, is_active=True))
    if len(users) != len(normalized_ids):
        return None, Response(
            {field_name: ["One or more users do not exist or are inactive."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return users, None


def sync_task_assignments(task, users, assignment_type):
    target_user_ids = {user.id for user in users}
    existing_assignments = {
        assignment.user_id: assignment
        for assignment in TaskAssignment.objects.filter(
            task=task,
            assignment_type=assignment_type,
        )
    }
    TaskAssignment.objects.filter(
        task=task,
        assignment_type=assignment_type,
        user_id__in=set(existing_assignments) - target_user_ids,
    ).delete()
    TaskAssignment.objects.bulk_create(
        [
            TaskAssignment(
                task=task,
                user=user,
                assignment_type=assignment_type,
            )
            for user in users
            if user.id not in existing_assignments
        ]
    )


def get_default_active_status():
    return (
        TaskStatus.objects.filter(system_type=TaskStatus.SYSTEM_ACTIVE, is_active=True)
        .order_by("sort_order", "name")
        .first()
    )


def get_default_completed_status():
    return (
        TaskStatus.objects.filter(system_type=TaskStatus.SYSTEM_COMPLETED, is_active=True)
        .order_by("sort_order", "name")
        .first()
    )


def get_default_priority():
    normal_priority = Priority.objects.filter(code__iexact="normal").first()
    if normal_priority is not None:
        return normal_priority

    default_priority = Priority.objects.filter(is_default=True).order_by("sort_order", "name").first()
    if default_priority is not None:
        return default_priority

    return Priority.objects.order_by("sort_order", "name").first()


def get_next_task_sequence_number():
    max_sequence_number = Task.objects.aggregate(max_sequence_number=Max("sequence_number"))[
        "max_sequence_number"
    ]
    return (max_sequence_number or 0) + 1


def get_task_creation_validation_error(status_obj, priority, user):
    if status_obj is None:
        return Response(
            {"detail": "Не найден активный статус задачи."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if priority is None:
        return Response(
            {"detail": "Не найден приоритет по умолчанию."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user is None:
        return Response(
            {"detail": "Не найден пользователь для создания задачи."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return None


def get_request_user_or_fallback(request):
    if request.user.is_authenticated:
        return request.user

    # TODO: заменить fallback на request.user после внедрения авторизации API.
    return get_user_model().objects.order_by("id").first()