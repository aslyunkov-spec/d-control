from rest_framework import serializers

from .models import Task, TaskComment, TaskFile, TaskHistory


class TaskSerializer(serializers.ModelSerializer):
    status = serializers.StringRelatedField()
    status_system_type = serializers.CharField(source="status.system_type", read_only=True)
    priority = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    column = serializers.IntegerField(source="column_id", read_only=True)

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
            "due_date",
        )


class TaskAssigneeSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    assignment_id = serializers.IntegerField(source="id")
    assignment_status = serializers.CharField(source="status")
    assigned_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)


class TaskCommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()

    class Meta:
        model = TaskComment
        fields = (
            "id",
            "author",
            "text",
            "created_at",
        )


class TaskFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskFile
        fields = (
            "id",
            "original_name",
            "uploaded_at",
        )


class TaskHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskHistory
        fields = (
            "id",
            "event_type",
            "description",
            "created_at",
        )


class TaskDetailSerializer(serializers.ModelSerializer):
    status = serializers.StringRelatedField()
    priority = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    assignees = TaskAssigneeSerializer(source="assignments", many=True)
    comments = TaskCommentSerializer(many=True)
    files = TaskFileSerializer(many=True)
    history = TaskHistorySerializer(source="history_events", many=True)

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
            "comments",
            "files",
            "history",
        )