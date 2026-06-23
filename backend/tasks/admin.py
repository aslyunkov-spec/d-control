from django.contrib import admin

from .models import Priority, Task, TaskStatus


@admin.register(TaskStatus)
class TaskStatusAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "system_type",
        "sort_order",
        "is_active",
    )
    list_filter = (
        "system_type",
        "is_active",
    )
    search_fields = (
        "name",
        "code",
    )


@admin.register(Priority)
class PriorityAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "color",
        "sort_order",
        "is_default",
    )
    list_filter = (
        "is_default",
    )
    search_fields = (
        "name",
        "code",
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "number",
        "title",
        "department",
        "column",
        "status",
        "priority",
        "created_by",
        "due_date",
        "created_at",
    )
    list_filter = (
        "department",
        "column",
        "status",
        "priority",
        "deleted_at",
    )
    search_fields = (
        "number",
        "title",
        "description",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
        "closed_at",
        "archived_at",
        "deleted_at",
    )