from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import (
    Priority,
    Task,
    TaskAssignment,
    TaskStatus,
    SubTask,
    SubTaskAssignment,
    TaskComment,
    TaskFile,
)

@admin.register(TaskStatus)
class TaskStatusAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "system_type", "sort_order", "is_active")
    list_filter = ("system_type", "is_active")
    search_fields = ("name", "code")


@admin.register(Priority)
class PriorityAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "color", "sort_order", "is_default")
    list_filter = ("is_default",)
    search_fields = ("name", "code")


class TaskAssignmentInline(admin.TabularInline):
    model = TaskAssignment
    extra = 0
    autocomplete_fields = ("user",)
    fields = ("user", "status", "assigned_at", "completed_at")
    readonly_fields = ("assigned_at", "completed_at")


class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 0
    autocomplete_fields = ("author",)
    fields = ("author", "text", "is_system", "created_at")
    readonly_fields = ("created_at",)

class TaskFileInline(admin.TabularInline):
    model = TaskFile
    extra = 0

    autocomplete_fields = (
        "uploaded_by",
    )

    fields = (
        "file",
        "uploaded_by",
        "created_at",
    )

    readonly_fields = (
        "created_at",
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
        "is_overdue_display",
        "assignments_count",
        "subtasks_count",
        "created_at",
    )

    list_filter = (
        "department",
        "column",
        "status",
        "priority",
        "deleted_at",
        "due_date",
    )

    search_fields = (
        "number",
        "title",
        "description",
        "created_by__username",
        "created_by__email",
    )

    autocomplete_fields = (
        "department",
        "column",
        "parent_task",
        "status",
        "priority",
        "created_by",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "closed_at",
        "archived_at",
        "deleted_at",
    )

    ordering = ("-created_at",)
    list_per_page = 30

    inlines = (
        TaskAssignmentInline,
        TaskCommentInline,
        TaskFileInline,
    )

    fieldsets = (
        ("Основное", {
            "fields": (
                "number",
                "sequence_number",
                "title",
                "description",
                "department",
                "column",
                "parent_task",
            )
        }),
        ("Статус и приоритет", {
            "fields": ("status", "priority")
        }),
        ("Ответственные и сроки", {
            "fields": (
                "created_by",
                "due_date",
                "deferred_until",
            )
        }),
        ("Служебные даты", {
            "fields": (
                "created_at",
                "updated_at",
                "closed_at",
                "archived_at",
                "deleted_at",
            ),
            "classes": ("collapse",),
        }),
    )

    def is_overdue_display(self, obj):
        if obj.due_date and obj.due_date < timezone.now() and not obj.closed_at:
            return format_html(
                '<span style="color:{}; font-weight:bold;">{}</span>',
                "red",
                "Да",
            )

        return format_html(
            '<span style="color:{};">{}</span>',
            "green",
            "Нет",
        )

    is_overdue_display.short_description = "Просрочена"

    def assignments_count(self, obj):
        return obj.assignments.count()

    assignments_count.short_description = "Исполнителей"

    def subtasks_count(self, obj):
        return obj.child_subtasks.count()

    subtasks_count.short_description = "Подзадач"


@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ("task", "user", "status", "assigned_at", "completed_at")
    list_filter = ("status", "assigned_at", "completed_at", "task__department")
    search_fields = (
        "task__number",
        "task__title",
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    autocomplete_fields = ("task", "user")
    readonly_fields = ("assigned_at", "completed_at")
    ordering = ("-assigned_at",)
    list_per_page = 30

    fieldsets = (
        ("Назначение", {
            "fields": ("task", "user", "status")
        }),
        ("Даты", {
            "fields": ("assigned_at", "completed_at"),
            "classes": ("collapse",),
        }),
    )


class SubTaskAssignmentInline(admin.TabularInline):
    model = SubTaskAssignment
    extra = 0
    autocomplete_fields = ("user",)
    fields = ("user", "status", "assigned_at", "completed_at")
    readonly_fields = ("assigned_at", "completed_at")


@admin.register(SubTask)
class SubTaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "task",
        "status",
        "created_by",
        "approved_by",
        "due_date",
        "completed_at",
        "approved_at",
        "closed_at",
        "created_at",
    )

    list_filter = (
        "status",
        "due_date",
        "completed_at",
        "approved_at",
        "closed_at",
        "task__department",
    )

    search_fields = (
        "title",
        "description",
        "task__number",
        "task__title",
        "created_by__username",
        "created_by__email",
        "approved_by__username",
        "approved_by__email",
    )

    autocomplete_fields = ("task", "created_by", "approved_by")

    readonly_fields = (
        "created_at",
        "updated_at",
        "completed_at",
        "approved_at",
        "closed_at",
    )

    ordering = ("-created_at",)
    list_per_page = 30
    inlines = (SubTaskAssignmentInline,)


@admin.register(SubTaskAssignment)
class SubTaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ("subtask", "user", "status", "assigned_at", "completed_at")
    list_filter = ("status", "assigned_at", "completed_at")
    search_fields = (
        "subtask__title",
        "subtask__task__number",
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    autocomplete_fields = ("subtask", "user")
    readonly_fields = ("assigned_at", "completed_at")
    ordering = ("-assigned_at",)


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ("task", "author", "short_text", "is_system", "created_at")
    list_filter = ("is_system", "created_at", "task__department")
    search_fields = (
        "task__number",
        "task__title",
        "author__username",
        "author__email",
        "text",
    )
    autocomplete_fields = ("task", "author")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
    list_per_page = 30

    def short_text(self, obj):
        return obj.text[:80]

    short_text.short_description = "Текст"

@admin.register(TaskFile)
class TaskFileAdmin(admin.ModelAdmin):
    list_display = (
        "task",
        "uploaded_by",
        "file",
        "created_at",
    )

    list_filter = (
        "created_at",
        "task__department",
    )

    search_fields = (
        "task__number",
        "task__title",
        "file",
        "uploaded_by__username",
        "uploaded_by__email",
    )

    autocomplete_fields = (
        "task",
        "uploaded_by",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )