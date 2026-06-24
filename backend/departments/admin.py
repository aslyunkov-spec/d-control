from django.contrib import admin
from django.db.models import Count

from .models import Department, DepartmentColumn


class DepartmentColumnInline(admin.TabularInline):
    model = DepartmentColumn
    extra = 1
    fields = (
        "name",
        "sort_order",
        "is_active",
    )
    ordering = (
        "sort_order",
        "name",
    )


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    inlines = (DepartmentColumnInline,)
    list_display = (
        "name",
        "code",
        "sort_order",
        "is_active",
        "columns_count",
        "created_at",
    )

    search_fields = (
        "name",
        "code",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    readonly_fields = (
        "created_at",
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(columns_total=Count("columns"))

    @admin.display(description="Количество колонок", ordering="columns_total")
    def columns_count(self, obj):
        return obj.columns_total


@admin.register(DepartmentColumn)
class DepartmentColumnAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "department",
        "sort_order",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "department__name",
        "department__code",
    )

    list_filter = (
        "department",
        "is_active",
        "created_at",
    )

    readonly_fields = (
        "created_at",
    )

    list_select_related = (
        "department",
    )
