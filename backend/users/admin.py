from django import forms
from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.contrib.admin.widgets import FilteredSelectMultiple
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import (
    Permission,
    Role,
    RolePermission,
    UserPermissionOverride,
    UserProfile,
)

User = get_user_model()


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


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0
    max_num = 1
    fields = (
        "role",
        "department",
        "email_notifications_enabled",
        "avatar",
    )


try:
    admin.site.unregister(User)
except NotRegistered:
    pass


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    inlines = (UserProfileInline,)
    list_display = (
        "username",
        "email",
        "full_name",
        "profile_role",
        "profile_department",
        "is_active",
        "date_joined",
    )
    search_fields = (
        "username",
        "first_name",
        "last_name",
        "email",
    )
    list_filter = (
        "profile__role",
        "profile__department",
        "is_active",
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("profile__role", "profile__department")

    def get_inline_instances(self, request, obj=None):
        if obj is None:
            return []
        return super().get_inline_instances(request, obj)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        UserProfile.objects.get_or_create(user=obj)

    @admin.display(description="Имя и фамилия", ordering="first_name")
    def full_name(self, obj):
        return obj.get_full_name()

    @admin.display(description="Роль", ordering="profile__role__name")
    def profile_role(self, obj):
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return None

    @admin.display(description="Отдел", ordering="profile__department__name")
    def profile_department(self, obj):
        try:
            return obj.profile.department
        except UserProfile.DoesNotExist:
            return None


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
        "department",
        "email_notifications_enabled",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "role",
        "department",
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
        "department__code",
        "department__name",
    )
