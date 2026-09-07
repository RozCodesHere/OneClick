from django.contrib import admin

from .models import Service, ServiceCategory


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "slug",
        "is_active",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "base_price",
        "estimated_duration",
        "is_active",
    )

    list_filter = (
        "category",
        "is_active",
    )

    search_fields = (
        "name",
        "category__name",
    )