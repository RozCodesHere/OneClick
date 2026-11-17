
from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "recipient",
        "title",
        "notification_type",
        "priority",
        "is_read",
        "email_sent",
        "created_at",
    )

    list_filter = (
        "notification_type",
        "priority",
        "is_read",
        "email_sent",
    )

    search_fields = (
        "recipient__email",
        "title",
        "message",
    )

    readonly_fields = (
        "created_at",
        "read_at",
        "email_sent_at",
    )
