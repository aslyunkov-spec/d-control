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
    list_display = ("name", "description", "created_at")
    search_fields = ("name",)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category")
    search_fields = ("code", "name")
    list_filter = ("category",)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("role", "permission")
    list_filter = ("role",)


@admin.register(UserPermissionOverride)
class UserPermissionOverrideAdmin(admin.ModelAdmin):
    list_display = ("user", "permission", "allow", "created_at")
    list_filter = ("allow", "permission")
    search_fields = ("user__username", "user__email", "permission__code")

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "role",
        "email_notifications_enabled",
    )

    list_filter = (
        "role",
        "email_notifications_enabled",
    )

    search_fields = (
        "user__username",
        "user__email",
    )