from django.contrib import admin
from django.db.models import Count

from .models import (
    Priority,
    Task,
    TaskAssignment,
    TaskComment,
    TaskFile,
    TaskHistory,
    TaskStatus,
)


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


class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 1
    fields = (
        "author",
        "text",
        "created_at",
        "updated_at",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    autocomplete_fields = (
        "author",
    )


class TaskFileInline(admin.TabularInline):
    model = TaskFile
    extra = 1
    fields = (
        "uploaded_by",
        "comment",
        "file",
        "original_name",
        "uploaded_at",
    )
    readonly_fields = (
        "uploaded_at",
    )
    autocomplete_fields = (
        "uploaded_by",
    )


class TaskHistoryInline(admin.TabularInline):
    model = TaskHistory
    extra = 0
    can_delete = False
    fields = (
        "created_at",
        "user",
        "event_type",
        "description",
    )
    readonly_fields = fields
    ordering = (
        "-created_at",
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


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
        TaskCommentInline,
        TaskFileInline,
        TaskHistoryInline,
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


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = (
        "task",
        "author",
        "short_text",
        "created_at",
    )
    list_filter = (
        "created_at",
        "updated_at",
    )
    search_fields = (
        "task__number",
        "task__title",
        "author__username",
        "author__email",
        "author__first_name",
        "author__last_name",
        "text",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    autocomplete_fields = (
        "task",
        "author",
    )
    list_select_related = (
        "task",
        "author",
    )

    @admin.display(description="Текст")
    def short_text(self, obj):
        if len(obj.text) <= 80:
            return obj.text
        return f"{obj.text[:77]}..."


@admin.register(TaskFile)
class TaskFileAdmin(admin.ModelAdmin):
    list_display = (
        "task",
        "uploaded_by",
        "comment",
        "original_name",
        "uploaded_at",
    )
    list_filter = (
        "uploaded_at",
    )
    search_fields = (
        "task__number",
        "task__title",
        "uploaded_by__username",
        "uploaded_by__email",
        "uploaded_by__first_name",
        "uploaded_by__last_name",
        "original_name",
        "file",
    )
    readonly_fields = (
        "uploaded_at",
    )
    autocomplete_fields = (
        "task",
        "uploaded_by",
        "comment",
    )
    list_select_related = (
        "task",
        "uploaded_by",
        "comment",
    )


@admin.register(TaskHistory)
class TaskHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "task",
        "user",
        "event_type",
        "short_description",
        "created_at",
    )
    list_filter = (
        "event_type",
        "created_at",
    )
    search_fields = (
        "task__number",
        "task__title",
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "description",
    )
    readonly_fields = (
        "task",
        "user",
        "event_type",
        "description",
        "created_at",
    )
    autocomplete_fields = (
        "task",
        "user",
    )
    list_select_related = (
        "task",
        "user",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description="Описание")
    def short_description(self, obj):
        if len(obj.description) <= 80:
            return obj.description
        return f"{obj.description[:77]}..."