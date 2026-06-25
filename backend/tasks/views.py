from django.contrib.auth import get_user_model
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
            "assignments__user",
            "comments__author",
            "files__uploaded_by",
            "history_events",
            "subtasks__status",
            "subtasks__priority",
            "subtasks__department",
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["user"] = get_request_user_or_fallback(self.request)
        return context

    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        title = str(request.data.get("title", "")).strip()

        if not title:
            return Response(
                {"title": ["Название задачи не может быть пустым."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task.title = title
        task.save(update_fields=["title", "updated_at"])

        serializer = TaskSerializer(task)
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

def inherit_task_assignments(parent_task, subtask):
    parent_assignments = parent_task.assignments.select_related("user")
    TaskAssignment.objects.bulk_create(
        [
            TaskAssignment(
                task=subtask,
                user=assignment.user,
                status=TaskAssignment.STATUS_ASSIGNED,
            )
            for assignment in parent_assignments
        ],
        ignore_conflicts=True,
    )
def is_completed_or_archived(status_obj):
    return status_obj.system_type in [TaskStatus.SYSTEM_COMPLETED, TaskStatus.SYSTEM_ARCHIVED]


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