from rest_framework import serializers

from .models import SupportTicket, ContactMessage


# =========================================================
# USER SUPPORT TICKET SERIALIZER
# =========================================================

class SupportTicketSerializer(
    serializers.ModelSerializer
):

    user_name = serializers.SerializerMethodField()

    user_email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    class Meta:

        model = SupportTicket

        fields = [
            "id",
            "user_name",
            "user_email",
            "subject",
            "category",
            "message",
            "attachment",
            "status",
            "priority",
            "admin_response",
            "created_at",
            "updated_at",
        ]

        # Users can create tickets,
        # but they cannot change ticket status
        # or write an admin response.

        read_only_fields = [
            "id",
            "user_name",
            "user_email",
            "status",
            "admin_response",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):

        full_name = (
            f"{obj.user.first_name} "
            f"{obj.user.last_name}"
        ).strip()

        if full_name:
            return full_name

        return obj.user.email


# =========================================================
# ADMIN SUPPORT TICKET SERIALIZER
# =========================================================

class AdminSupportTicketSerializer(
    serializers.ModelSerializer
):

    user_name = serializers.SerializerMethodField()

    user_email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    class Meta:

        model = SupportTicket

        fields = [
            "id",
            "user_name",
            "user_email",
            "subject",
            "category",
            "message",
            "attachment",
            "status",
            "priority",
            "admin_response",
            "created_at",
            "updated_at",
        ]

        # Admin can update:
        # status
        # priority
        # admin_response
        #
        # These fields remain read-only:
        # id
        # user information
        # timestamps

        read_only_fields = [
            "id",
            "user_name",
            "user_email",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):

        full_name = (
            f"{obj.user.first_name} "
            f"{obj.user.last_name}"
        ).strip()

        if full_name:
            return full_name

        return obj.user.email

    # =========================================================
# PUBLIC CONTACT MESSAGE SERIALIZER
# =========================================================

class ContactMessageSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = ContactMessage

        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "subject",
            "message",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "is_read",
            "created_at",
        ]