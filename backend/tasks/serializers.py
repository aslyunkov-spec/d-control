from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Task, TaskComment, TaskFile, TaskHistory


def user_display_name(user):
    full_name = user.get_full_name()
    if full_name:
        return full_name
    return user.get_username()


def user_initials(user):
    parts = [user.first_name, user.last_name]
    initials = "".join(part[:1] for part in parts if part).upper()
    if initials:
        return initials[:2]

    username = user.get_username()
    return username[:2].upper()


def user_avatar(user):
    profile = getattr(user, "profile", None)
    avatar = getattr(profile, "avatar", None)
    return avatar.url if avatar else ""


def user_role_name(user):
    profile = getattr(user, "profile", None)
    role = getattr(profile, "role", None)
    return role.name if role else None


def get_local_dev_user():
    return get_user_model().objects.order_by("id").first()


class TaskListAssigneeSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    avatar = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return user_avatar(obj.user)

    def get_initials(self, obj):
        return user_initials(obj.user)

    def get_role(self, obj):
        return user_role_name(obj.user)


class TaskSerializer(serializers.ModelSerializer):
    status = serializers.StringRelatedField()
    status_system_type = serializers.CharField(source="status.system_type", read_only=True)
    priority = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    column = serializers.IntegerField(source="column_id", read_only=True)
    parent_task = serializers.IntegerField(source="parent_task_id", read_only=True)
    comments_count = serializers.SerializerMethodField()
    files_count = serializers.SerializerMethodField()
    subtasks_total = serializers.SerializerMethodField()
    subtasks_completed = serializers.SerializerMethodField()
    subtasks = serializers.SerializerMethodField()
    assignees = serializers.SerializerMethodField()
    watchers = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id",
            "number",
            "title",
            "status",
            "status_system_type",
            "priority",
            "department",
            "column",
            "parent_task",
            "due_date",
            "created_at",
            "comments_count",
            "files_count",
            "subtasks_total",
            "subtasks_completed",
            "subtasks",
            "assignees",
            "watchers",
        )

    def get_assignees(self, obj):
        return TaskListAssigneeSerializer(
            [
                assignment
                for assignment in obj.assignments.all()
                if assignment.assignment_type == assignment.ASSIGNMENT_ASSIGNEE
            ],
            many=True,
        ).data

    def get_watchers(self, obj):
        return TaskListAssigneeSerializer(
            [
                assignment
                for assignment in obj.assignments.all()
                if assignment.assignment_type == assignment.ASSIGNMENT_WATCHER
            ],
            many=True,
        ).data

    def get_comments_count(self, obj):
        return getattr(obj, "comments_count", obj.comments.count())

    def get_files_count(self, obj):
        return getattr(obj, "files_count", obj.files.count())

    def get_subtasks_total(self, obj):
        return getattr(obj, "subtasks_total", obj.subtasks.count())

    def get_subtasks_completed(self, obj):
        return getattr(
            obj,
            "subtasks_completed",
            obj.subtasks.filter(status__system_type__in=["completed", "archived"]).count(),
        )

    def get_subtasks(self, obj):
        return [
            {
                "id": subtask.id,
                "number": subtask.number,
                "title": subtask.title,
                "status": str(subtask.status),
                "status_system_type": subtask.status.system_type,
                "parent_task": obj.id,
                "due_date": subtask.due_date,
                "created_at": subtask.created_at,
                "assignees": TaskListAssigneeSerializer(
                    [
                        assignment
                        for assignment in subtask.assignments.all()
                        if assignment.assignment_type == assignment.ASSIGNMENT_ASSIGNEE
                    ],
                    many=True,
                ).data,
            }
            for subtask in obj.subtasks.all()
        ]


class TaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500, trim_whitespace=True)
    department = serializers.IntegerField()
    column = serializers.IntegerField()


class TaskSubtaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500, trim_whitespace=True)


class TaskAssigneeSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    avatar = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    assignment_id = serializers.IntegerField(source="id")
    assignment_status = serializers.CharField(source="status")
    assigned_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)

    def get_avatar(self, obj):
        return user_avatar(obj.user)

    def get_initials(self, obj):
        return user_initials(obj.user)

    def get_role(self, obj):
        return user_role_name(obj.user)


class TaskTimelineUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "avatar",
            "initials",
        )

    def get_avatar(self, obj):
        return user_avatar(obj)

    def get_initials(self, obj):
        return user_initials(obj)


class TaskCommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    author_details = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    is_edited = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = (
            "id",
            "author",
            "author_id",
            "author_details",
            "can_edit",
            "text",
            "created_at",
            "updated_at",
            "is_edited",
        )

    def get_author_details(self, obj):
        return TaskTimelineUserSerializer(obj.author).data

    def get_can_edit(self, obj):
        user = self.context.get("user") or get_local_dev_user()
        return bool(user and obj.author_id == user.id)

    def get_is_edited(self, obj):
        if not obj.created_at or not obj.updated_at:
            return False

        return abs((obj.updated_at - obj.created_at).total_seconds()) > 1


class TaskFileSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    uploaded_by_details = serializers.SerializerMethodField()
    uploaded_by_id = serializers.IntegerField(source="uploaded_by.id", read_only=True)
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)
    uploaded_by_first_name = serializers.CharField(source="uploaded_by.first_name", read_only=True)
    uploaded_by_last_name = serializers.CharField(source="uploaded_by.last_name", read_only=True)
    can_delete = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskFile
        fields = (
            "id",
            "author",
            "uploaded_by_details",
            "uploaded_by_id",
            "uploaded_by_username",
            "uploaded_by_first_name",
            "uploaded_by_last_name",
            "can_delete",
            "original_name",
            "uploaded_at",
            "file_url",
        )

    def get_author(self, obj):
        return user_display_name(obj.uploaded_by)

    def get_uploaded_by_details(self, obj):
        return TaskTimelineUserSerializer(obj.uploaded_by).data

    def get_can_delete(self, obj):
        user = self.context.get("user") or get_local_dev_user()
        return bool(user and obj.uploaded_by_id == user.id)

    def get_file_url(self, obj):
        if not obj.file:
            return ""

        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(obj.file.url)

        return obj.file.url


class TaskHistorySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = TaskHistory
        fields = (
            "id",
            "user",
            "user_details",
            "event_type",
            "description",
            "created_at",
        )

    def get_user_details(self, obj):
        if not obj.user_id:
            return None
        return TaskTimelineUserSerializer(obj.user).data


class TaskDetailSerializer(serializers.ModelSerializer):
    status = serializers.StringRelatedField()
    priority = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    assignees = serializers.SerializerMethodField()
    watchers = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()
    history = TaskHistorySerializer(source="history_events", many=True)
    subtasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "number",
            "title",
            "description",
            "status",
            "priority",
            "department",
            "due_date",
            "created_at",
            "assignees",
            "watchers",
            "comments",
            "files",
            "history",
            "subtasks",
        )

    def get_assignees(self, obj):
        return TaskAssigneeSerializer(
            [
                assignment
                for assignment in obj.assignments.all()
                if assignment.assignment_type == assignment.ASSIGNMENT_ASSIGNEE
            ],
            many=True,
        ).data

    def get_watchers(self, obj):
        return TaskAssigneeSerializer(
            [
                assignment
                for assignment in obj.assignments.all()
                if assignment.assignment_type == assignment.ASSIGNMENT_WATCHER
            ],
            many=True,
        ).data

    def get_comments(self, obj):
        return TaskCommentSerializer(
            obj.comments.order_by("created_at", "id"),
            many=True,
            context={"user": self.context.get("user")},
        ).data

    def get_files(self, obj):
        return TaskFileSerializer(
            obj.files.all(),
            many=True,
            context={
                "request": self.context.get("request"),
                "user": self.context.get("user"),
            },
        ).data