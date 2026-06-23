from django.contrib import admin

from .models import Department, DepartmentColumn


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "sort_order",
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )

    list_filter = (
        "is_active",
    )


@admin.register(DepartmentColumn)
class DepartmentColumnAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "department",
        "sort_order",
        "is_active",
    )

    search_fields = (
        "name",
    )

    list_filter = (
        "department",
        "is_active",
    )