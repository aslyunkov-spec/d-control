from django.urls import path

from .views import DepartmentColumnListAPIView, DepartmentListAPIView

app_name = "departments"

urlpatterns = [
    path("departments/", DepartmentListAPIView.as_view(), name="department-list"),
    path(
        "departments/<int:department_id>/columns/",
        DepartmentColumnListAPIView.as_view(),
        name="department-column-list",
    ),
]
