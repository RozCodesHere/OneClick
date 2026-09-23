from django.contrib import admin
from .models import SupportTicket, ContactMessage


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "subject",
        "category",
        "status",
        "priority",
        "created_at",
    )

    list_filter = (
        "status",
        "priority",
        "category",
        "created_at",
    )

    search_fields = (
        "subject",
        "message",
        "user__email",
        "user__first_name",
        "user__last_name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)

    # =========================================================
# PUBLIC CONTACT MESSAGES
# =========================================================

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "full_name",
        "email",
        "subject",
        "is_read",
        "created_at",
    )

    list_filter = (
        "is_read",
        "created_at",
    )

    search_fields = (
        "full_name",
        "email",
        "subject",
        "message",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )