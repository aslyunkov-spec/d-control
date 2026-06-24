from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    status = serializers.StringRelatedField()
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
            "priority",
            "department",
            "column",
            "due_date",
        )
