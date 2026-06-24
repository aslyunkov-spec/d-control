from django.contrib import admin

from .models import (
    Permission,
    Role,
    RolePermission,
    UserPermissionOverride,
    UserProfile,
)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "description", "created_at")
    search_fields = ("code", "name", "description")
    list_filter = ("created_at",)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "description", "created_at")
    search_fields = ("code", "name", "description", "category")
    list_filter = ("category", "created_at")


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("role", "permission")
    search_fields = (
        "role__code",
        "role__name",
        "permission__code",
        "permission__name",
    )
    list_filter = ("role", "permission__category")


@admin.register(UserPermissionOverride)
class UserPermissionOverrideAdmin(admin.ModelAdmin):
    list_display = ("user", "permission", "allow", "created_at")
    search_fields = (
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "permission__code",
        "permission__name",
    )
    list_filter = ("allow", "permission__category", "permission", "created_at")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "role",
        "email_notifications_enabled",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "role",
        "email_notifications_enabled",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "role__code",
        "role__name",
    )
