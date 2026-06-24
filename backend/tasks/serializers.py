from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    status = serializers.StringRelatedField()
    priority = serializers.StringRelatedField()
    department = serializers.StringRelatedField()

    class Meta:
        model = Task
        fields = (
            "id",
            "number",
            "title",
            "status",
            "priority",
            "department",
            "due_date",
        )
