from django.db import models
from django.conf import settings

from departments.models import Department, DepartmentColumn


COMPLETED_STATUS_CODES = {"completed", "done"}
COMPLETED_STATUS_NAMES = {"выполнено", "завершено"}


def is_completed_status(status):
    if status is None:
        return False

    code = (status.code or "").strip().lower()
    name = (status.name or "").strip().lower()

    return (
        status.system_type == TaskStatus.SYSTEM_COMPLETED
        or code in COMPLETED_STATUS_CODES
        or name in COMPLETED_STATUS_NAMES
    )


def user_display_name(user):
    full_name = user.get_full_name()
    if full_name:
        return full_name
    return user.get_username()


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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        update_fields = kwargs.get("update_fields")
        track_status = not is_new and (
            update_fields is None
            or "status" in update_fields
            or "status_id" in update_fields
        )
        old_status = None

        if track_status:
            old_task = Task.objects.select_related("status").get(pk=self.pk)
            old_status = old_task.status

        super().save(*args, **kwargs)

        if is_new:
            TaskHistory.objects.create(
                task=self,
                user=self.created_by,
                event_type=TaskHistory.EVENT_CREATED,
                description=f"Задача {self.number} создана.",
            )
            return

        if track_status and old_status and old_status.pk != self.status_id:
            TaskHistory.objects.create(
                task=self,
                user=self.created_by,
                event_type=TaskHistory.EVENT_STATUS_CHANGED,
                description=(
                    f"Статус изменён: {old_status.name} → {self.status.name}."
                ),
            )

            if is_completed_status(self.status):
                TaskHistory.objects.create(
                    task=self,
                    user=self.created_by,
                    event_type=TaskHistory.EVENT_COMPLETED,
                    description=f"Задача {self.number} отмечена выполненной.",
                )


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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            TaskHistory.objects.create(
                task=self.task,
                user=self.task.created_by,
                event_type=TaskHistory.EVENT_ASSIGNED,
                description=f"Назначен исполнитель: {user_display_name(self.user)}.",
            )

    def delete(self, *args, **kwargs):
        task = self.task
        assigned_user_name = user_display_name(self.user)
        history_user = task.created_by

        super().delete(*args, **kwargs)

        TaskHistory.objects.create(
            task=task,
            user=history_user,
            event_type=TaskHistory.EVENT_UNASSIGNED,
            description=f"Снят исполнитель: {assigned_user_name}.",
        )


class TaskComment(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name="Задача",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="task_comments",
        verbose_name="Автор",
    )
    text = models.TextField("Комментарий")
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)
    updated_at = models.DateTimeField("Дата изменения", auto_now=True)

    class Meta:
        verbose_name = "Комментарий к задаче"
        verbose_name_plural = "Комментарии к задачам"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.task.number} — {self.author}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            TaskHistory.objects.create(
                task=self.task,
                user=self.author,
                event_type=TaskHistory.EVENT_COMMENTED,
                description="Добавлен комментарий.",
            )


class TaskFile(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="files",
        verbose_name="Задача",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_task_files",
        verbose_name="Загрузил",
    )
    file = models.FileField(
        "Файл",
        upload_to="task_files/%Y/%m/%d/",
    )
    original_name = models.CharField("Исходное имя файла", max_length=255)
    uploaded_at = models.DateTimeField("Дата загрузки", auto_now_add=True)

    class Meta:
        verbose_name = "Файл задачи"
        verbose_name_plural = "Файлы задач"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.original_name

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            TaskHistory.objects.create(
                task=self.task,
                user=self.uploaded_by,
                event_type=TaskHistory.EVENT_FILE_UPLOADED,
                description=f"Загружен файл: {self.original_name}.",
            )


class TaskHistory(models.Model):
    EVENT_CREATED = "created"
    EVENT_UPDATED = "updated"
    EVENT_STATUS_CHANGED = "status_changed"
    EVENT_ASSIGNED = "assigned"
    EVENT_UNASSIGNED = "unassigned"
    EVENT_COMMENTED = "commented"
    EVENT_FILE_UPLOADED = "file_uploaded"
    EVENT_COMPLETED = "completed"
    EVENT_ARCHIVED = "archived"

    EVENT_TYPE_CHOICES = [
        (EVENT_CREATED, "Задача создана"),
        (EVENT_UPDATED, "Задача изменена"),
        (EVENT_STATUS_CHANGED, "Изменён статус"),
        (EVENT_ASSIGNED, "Назначен исполнитель"),
        (EVENT_UNASSIGNED, "Снят исполнитель"),
        (EVENT_COMMENTED, "Добавлен комментарий"),
        (EVENT_FILE_UPLOADED, "Загружен файл"),
        (EVENT_COMPLETED, "Задача выполнена"),
        (EVENT_ARCHIVED, "Задача перенесена в архив"),
    ]

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="history_events",
        verbose_name="Задача",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="task_history_events",
        verbose_name="Пользователь",
    )
    event_type = models.CharField(
        "Тип события",
        max_length=30,
        choices=EVENT_TYPE_CHOICES,
    )
    description = models.TextField("Описание")
    created_at = models.DateTimeField("Дата события", auto_now_add=True)

    class Meta:
        verbose_name = "Событие задачи"
        verbose_name_plural = "История задач"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.task.number} — {self.get_event_type_display()}"