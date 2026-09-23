from django.contrib import admin

from .models import (
    ServiceCategory,
    Service,
    ServiceRequest,
    Quotation,
)


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


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "customer",
        "service",
        "address",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "service",
        "created_at",
    )

    search_fields = (
        "customer__email",
        "customer__first_name",
        "customer__last_name",
        "service__name",
        "address",
    )

    readonly_fields = (
        "created_at",
    )


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "request",
        "provider",
        "price",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "request__customer__email",
        "request__service__name",
        "provider__user__email",
    )

    readonly_fields = (
        "created_at",
    )