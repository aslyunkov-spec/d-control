from django import forms
from django.contrib import admin
from django.contrib.admin.widgets import FilteredSelectMultiple

from .models import (
    Permission,
    Role,
    RolePermission,
    UserPermissionOverride,
    UserProfile,
)


class RoleAdminForm(forms.ModelForm):
    permissions = forms.ModelMultipleChoiceField(
        label="Разрешения",
        queryset=Permission.objects.all(),
        required=False,
        widget=FilteredSelectMultiple("разрешения", is_stacked=False),
    )

    class Meta:
        model = Role
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance.pk:
            self.fields["permissions"].initial = Permission.objects.filter(
                role_permissions__role=self.instance
            )

    def save_permissions(self):
        if not self.instance.pk:
            return

        selected_permissions = self.cleaned_data.get("permissions")
        if selected_permissions is None:
            return

        selected_ids = set(selected_permissions.values_list("id", flat=True))
        existing_ids = set(
            RolePermission.objects.filter(role=self.instance).values_list(
                "permission_id",
                flat=True,
            )
        )

        permissions_to_add = selected_ids - existing_ids
        permissions_to_remove = existing_ids - selected_ids

        RolePermission.objects.bulk_create(
            [
                RolePermission(role=self.instance, permission_id=permission_id)
                for permission_id in permissions_to_add
            ]
        )
        RolePermission.objects.filter(
            role=self.instance,
            permission_id__in=permissions_to_remove,
        ).delete()


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    form = RoleAdminForm
    list_display = ("code", "name", "description", "created_at")
    search_fields = ("code", "name", "description")
    list_filter = ("created_at",)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        form.save_permissions()


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
