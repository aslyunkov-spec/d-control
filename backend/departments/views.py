from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from .models import Department, DepartmentColumn
from .serializers import DepartmentColumnSerializer, DepartmentSerializer


class DepartmentListAPIView(ListAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return Department.objects.filter(is_active=True).order_by("sort_order", "name")


class DepartmentColumnListAPIView(ListAPIView):
    serializer_class = DepartmentColumnSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return DepartmentColumn.objects.filter(
            department_id=self.kwargs["department_id"],
            is_active=True,
        ).order_by("sort_order", "name")
