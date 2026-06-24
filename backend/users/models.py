from django.db import models
from django.conf import settings
from departments.models import Department


class Role(models.Model):
    code = models.CharField(
        "Код",
        max_length=100,
        unique=True,
    )

    name = models.CharField(
        "Название",
        max_length=150,
        unique=True,
    )

    description = models.TextField(
        "Описание",
        blank=True,
    )

    created_at = models.DateTimeField(
        "Дата создания",
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "Роль"
        verbose_name_plural = "Роли"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Permission(models.Model):
    code = models.CharField("Код", max_length=100, unique=True)
    name = models.CharField("Название", max_length=150)
    description = models.TextField("Описание", blank=True)
    category = models.CharField("Категория", max_length=100, blank=True)

    created_at = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        verbose_name = "Разрешение"
        verbose_name_plural = "Разрешения"
        ordering = ["category", "code"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class RolePermission(models.Model):
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="role_permissions",
        verbose_name="Роль",
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="role_permissions",
        verbose_name="Разрешение",
    )

    class Meta:
        verbose_name = "Разрешение роли"
        verbose_name_plural = "Разрешения ролей"
        unique_together = ("role", "permission")

    def __str__(self):
        return f"{self.role} → {self.permission}"


class UserPermissionOverride(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="permission_overrides",
        verbose_name="Пользователь",
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="user_overrides",
        verbose_name="Разрешение",
    )
    allow = models.BooleanField("Разрешить", default=True)

    created_at = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        verbose_name = "Индивидуальное разрешение"
        verbose_name_plural = "Индивидуальные разрешения"
        unique_together = ("user", "permission")

    def __str__(self):
        sign = "+" if self.allow else "-"
        return f"{self.user} {sign} {self.permission.code}"

class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        verbose_name="Пользователь",
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="users",
        verbose_name="Роль",
        null=True,
        blank=True,
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="user_profiles",
        verbose_name="Отдел",
        null=True,
        blank=True,
    )
    avatar = models.ImageField(
        "Аватар",
        upload_to="avatars/",
        null=True,
        blank=True,
    )

    email_notifications_enabled = models.BooleanField(
        "Email-уведомления включены",
        default=True,
    )

    created_at = models.DateTimeField(
        "Дата создания",
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        "Дата обновления",
        auto_now=True,
    )

    class Meta:
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"

    def __str__(self):
        return str(self.user)
