from django.db import models


class Department(models.Model):
    name = models.CharField("Название", max_length=150, unique=True)
    code = models.CharField("Код", max_length=50, unique=True)
    sort_order = models.PositiveIntegerField("Порядок сортировки", default=0)
    is_active = models.BooleanField("Активен", default=True)

    created_at = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name = "Отдел"
        verbose_name_plural = "Отделы"

    def __str__(self):
        return self.name


class DepartmentColumn(models.Model):
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="columns",
        verbose_name="Отдел",
    )
    name = models.CharField("Название", max_length=150)
    sort_order = models.PositiveIntegerField("Порядок сортировки", default=0)
    is_active = models.BooleanField("Активна", default=True)

    created_at = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "name"]
        unique_together = ("department", "name")
        verbose_name = "Колонка отдела"
        verbose_name_plural = "Колонки отделов"

    def __str__(self):
        return f"{self.department.name} / {self.name}"