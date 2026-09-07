from django.contrib import admin

from .models import ProviderProfile


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "category",
        "hourly_rate",
        "available",
        "verified",
    )

    list_filter = (
        "category",
        "available",
        "verified",
    )

    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
    )