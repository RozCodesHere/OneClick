
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
        "verification_status",
        "created_at",
        "country",
        "province",
        "district",
        "city",
    )

    list_filter = (
        "category",
        "available",
        "verification_status",
        "country",
        "province",
       "district",
    )

    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
    )

    ordering = (
        "-created_at",
    )
