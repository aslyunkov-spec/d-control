from rest_framework import serializers

from .models import Department, DepartmentColumn


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = (
            "id",
            "code",
            "name",
        )


class DepartmentColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentColumn
        fields = (
            "id",
            "name",
            "sort_order",
            "is_active",
        )
