from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import F, Max
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from tasks.models import Task

from .models import Department, DepartmentColumn
from .serializers import DepartmentColumnSerializer, DepartmentSerializer


MANAGEMENT_ROLE_CODES = {"admin", "administrator", "director"}
MANAGEMENT_ROLE_NAMES = {"administrator", "director", "администратор", "директор"}


def get_management_user(request):
    if request.user.is_authenticated:
        return request.user

    if settings.DEBUG:
        return get_user_model().objects.order_by("id").first()

    return None


def can_manage_columns(request):
    user = get_management_user(request)
    if not user:
        return False

    if user.is_superuser:
        return True

    profile = getattr(user, "profile", None)
    role = getattr(profile, "role", None)
    if not role:
        return False

    return (
        role.code.strip().lower() in MANAGEMENT_ROLE_CODES
        or role.name.strip().lower() in MANAGEMENT_ROLE_NAMES
    )


def management_denied_response():
    return Response(
        {"detail": "Only administrators and directors can manage columns."},
        status=status.HTTP_403_FORBIDDEN,
    )


class DepartmentListAPIView(ListAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return Department.objects.filter(is_active=True).order_by("sort_order", "name")


class DepartmentColumnListAPIView(ListAPIView):
    serializer_class = DepartmentColumnSerializer
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return DepartmentColumn.objects.filter(
            department_id=self.kwargs["department_id"],
            is_active=True,
        ).order_by("sort_order", "name")

    def post(self, request, department_id):
        if not can_manage_columns(request):
            return management_denied_response()

        department = Department.objects.filter(pk=department_id).first()
        if not department:
            return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)

        name = str(request.data.get("name", "")).strip()
        if not name:
            return Response({"name": ["Column name cannot be empty."]}, status=status.HTTP_400_BAD_REQUEST)

        if DepartmentColumn.objects.filter(department=department, name=name).exists():
            return Response({"name": ["A column with this name already exists."]}, status=status.HTTP_400_BAD_REQUEST)

        sort_order = (columns.aggregate(max_sort_order=Max("sort_order"))["max_sort_order"] or 0) + 1

        column = DepartmentColumn.objects.create(
            department=department,
            name=name,
            sort_order=sort_order,
        )
        return Response(DepartmentColumnSerializer(column).data, status=status.HTTP_201_CREATED)


class DepartmentColumnDetailAPIView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def get_column(self, department_id, column_id):
        return DepartmentColumn.objects.filter(
            pk=column_id,
            department_id=department_id,
        ).first()

    def patch(self, request, department_id, column_id):
        if not can_manage_columns(request):
            return management_denied_response()

        column = self.get_column(department_id, column_id)
        if not column:
            return Response({"detail": "Column not found."}, status=status.HTTP_404_NOT_FOUND)

        name = str(request.data.get("name", "")).strip()
        if not name:
            return Response({"name": ["Column name cannot be empty."]}, status=status.HTTP_400_BAD_REQUEST)

        if DepartmentColumn.objects.filter(department=column.department, name=name).exclude(pk=column.pk).exists():
            return Response({"name": ["A column with this name already exists."]}, status=status.HTTP_400_BAD_REQUEST)

        column.name = name
        column.save(update_fields=["name"])
        return Response(DepartmentColumnSerializer(column).data)

    def delete(self, request, department_id, column_id):
        if not can_manage_columns(request):
            return management_denied_response()

        column = self.get_column(department_id, column_id)
        if not column:
            return Response({"detail": "Column not found."}, status=status.HTTP_404_NOT_FOUND)

        if Task.objects.filter(column=column).exists():
            return Response(
                {"detail": "Cannot delete a column that contains tasks."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        column.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
