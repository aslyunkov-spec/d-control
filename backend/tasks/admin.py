from django.contrib import admin
from django.db.models import Count

from .models import Priority, Task, TaskAssignment, TaskStatus


class TaskAssignmentInline(admin.TabularInline):
    model = TaskAssignment
    extra = 1
    fields = (
        "user",
        "status",
        "assigned_at",
        "completed_at",
    )
    readonly_fields = (
        "assigned_at",
    )
    autocomplete_fields = (
        "user",
    )


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
    ordering = (
        "sort_order",
        "name",
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
    ordering = (
        "sort_order",
        "name",
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    inlines = (
        TaskAssignmentInline,
    )
    list_display = (
        "number",
        "title",
        "department",
        "status",
        "priority",
        "due_date",
        "created_by",
        "created_at",
        "assignments_count",
        "subtasks_count",
    )
    list_filter = (
        "department",
        "status",
        "priority",
        "due_date",
        "created_at",
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
    autocomplete_fields = (
        "department",
        "column",
        "parent_task",
        "status",
        "priority",
        "created_by",
    )
    list_select_related = (
        "department",
        "status",
        "priority",
        "created_by",
    )

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "number",
                    "sequence_number",
                    "title",
                    "description",
                )
            },
        ),
        (
            "Доска",
            {
                "fields": (
                    "department",
                    "column",
                    "parent_task",
                    "status",
                    "priority",
                )
            },
        ),
        (
            "Участники и сроки",
            {
                "fields": (
                    "created_by",
                    "due_date",
                    "deferred_until",
                )
            },
        ),
        (
            "Системные даты",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                    "closed_at",
                    "archived_at",
                    "deleted_at",
                ),
                "classes": (
                    "collapse",
                ),
            },
        ),
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(
            assignments_total=Count("assignments", distinct=True),
            subtasks_total=Count("subtasks", distinct=True),
        )

    @admin.display(description="Количество исполнителей", ordering="assignments_total")
    def assignments_count(self, obj):
        return obj.assignments_total

    @admin.display(description="Количество подзадач", ordering="subtasks_total")
    def subtasks_count(self, obj):
        return obj.subtasks_total


@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "task",
        "user",
        "status",
        "assigned_at",
        "completed_at",
    )
    list_filter = (
        "status",
        "assigned_at",
        "completed_at",
    )
    search_fields = (
        "task__number",
        "task__title",
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    readonly_fields = (
        "assigned_at",
    )
    autocomplete_fields = (
        "task",
        "user",
    )
    list_select_related = (
        "task",
        "user",
    )
