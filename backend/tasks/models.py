from django.db import models
from django.conf import settings

from departments.models import Department, DepartmentColumn


class TaskStatus(models.Model):
    SYSTEM_ACTIVE = "active"
    SYSTEM_DEFERRED = "deferred"
    SYSTEM_COMPLETED = "completed"
    SYSTEM_ARCHIVED = "archived"

    SYSTEM_TYPE_CHOICES = [
        (SYSTEM_ACTIVE, "Активные"),
        (SYSTEM_DEFERRED, "Отложенные"),
        (SYSTEM_COMPLETED, "Выполненные"),
        (SYSTEM_ARCHIVED, "Архив"),
    ]

    code = models.CharField("Код", max_length=100, unique=True)
    name = models.CharField("Название", max_length=150)
    system_type = models.CharField(
        "Системный тип",
        max_length=30,
        choices=SYSTEM_TYPE_CHOICES,
    )
    sort_order = models.PositiveIntegerField("Порядок сортировки", default=0)
    is_active = models.BooleanField("Активен", default=True)

    class Meta:
        verbose_name = "Статус задачи"
        verbose_name_plural = "Статусы задач"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Priority(models.Model):
    name = models.CharField("Название", max_length=100, unique=True)
    code = models.CharField("Код", max_length=50, unique=True)
    color = models.CharField("Цвет", max_length=50, blank=True)
    sort_order = models.PositiveIntegerField("Порядок сортировки", default=0)
    is_default = models.BooleanField("По умолчанию", default=False)

    class Meta:
        verbose_name = "Приоритет"
        verbose_name_plural = "Приоритеты"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Task(models.Model):
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="tasks",
        verbose_name="Отдел",
    )
    column = models.ForeignKey(
        DepartmentColumn,
        on_delete=models.PROTECT,
        related_name="tasks",
        verbose_name="Колонка",
    )
    parent_task = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        related_name="subtasks",
        verbose_name="Родительская задача",
        null=True,
        blank=True,
    )

    status = models.ForeignKey(
        TaskStatus,
        on_delete=models.PROTECT,
        related_name="tasks",
        verbose_name="Статус",
    )
    priority = models.ForeignKey(
        Priority,
        on_delete=models.PROTECT,
        related_name="tasks",
        verbose_name="Приоритет",
    )

    number = models.CharField("Номер задачи", max_length=50, unique=True)
    sequence_number = models.PositiveIntegerField("Порядковый номер")

    title = models.CharField("Название", max_length=500)
    description = models.TextField("Описание", blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_tasks",
        verbose_name="Автор",
    )

    due_date = models.DateTimeField("Срок выполнения", null=True, blank=True)
    deferred_until = models.DateTimeField("Отложена до", null=True, blank=True)

    created_at = models.DateTimeField("Дата создания", auto_now_add=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True)

    closed_at = models.DateTimeField("Дата закрытия", null=True, blank=True)
    archived_at = models.DateTimeField("Дата архивации", null=True, blank=True)
    deleted_at = models.DateTimeField("Дата удаления", null=True, blank=True)

    class Meta:
        verbose_name = "Задача"
        verbose_name_plural = "Задачи"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.number} — {self.title}"

class TaskAssignment(models.Model):
    STATUS_ASSIGNED = "assigned"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_DONE = "done"
    STATUS_RETURNED = "returned"

    STATUS_CHOICES = [
        (STATUS_ASSIGNED, "Назначена"),
        (STATUS_IN_PROGRESS, "В работе"),
        (STATUS_DONE, "Выполнена"),
        (STATUS_RETURNED, "Возвращена"),
    ]

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="assignments",
        verbose_name="Задача",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="task_assignments",
        verbose_name="Исполнитель",
    )

    status = models.CharField(
        "Статус исполнителя",
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_ASSIGNED,
    )

    assigned_at = models.DateTimeField("Дата назначения", auto_now_add=True)
    completed_at = models.DateTimeField("Дата выполнения", null=True, blank=True)

    class Meta:
        verbose_name = "Исполнитель задачи"
        verbose_name_plural = "Исполнители задач"
        unique_together = ("task", "user")

    def __str__(self):
        return f"{self.task} → {self.user}"