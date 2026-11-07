from rest_framework import serializers

from .models import (
    Service,
    ServiceCategory,
    ServiceRequest,
    Quotation,
    ProviderService,
    Message,
)


# =========================================================
# SERVICE CATEGORY
# =========================================================

class ServiceCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = ServiceCategory

        fields = [
            "id",
            "name",
            "slug",
            "icon",
            "is_active",
        ]


# =========================================================
# SERVICE
# =========================================================

class ServiceSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    class Meta:
        model = Service

        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "description",
            "base_price",
            "estimated_duration",
            "is_active",
            "created_at",
        ]


# =========================================================
# SERVICE REQUEST
# =========================================================

class ServiceRequestSerializer(serializers.ModelSerializer):

    customer_name = serializers.SerializerMethodField()

    service_name = serializers.CharField(
        source="service.name",
        read_only=True,
    )

    class Meta:
        model = ServiceRequest

        fields = [
            "id",
            "customer",
            "customer_name",
            "service",
            "service_name",
            "description",
            "image",
            "address",
             "preferred_date",
            "preferred_time",
            "latitude",
            "longitude",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "customer",
            "customer_name",
            "status",
            "created_at",
        ]

    def get_customer_name(self, obj):

        full_name = (
            f"{obj.customer.first_name} "
            f"{obj.customer.last_name}"
        ).strip()

        return full_name or obj.customer.email


# =========================================================
# QUOTATION
# =========================================================

class QuotationSerializer(serializers.ModelSerializer):

    provider_name = serializers.SerializerMethodField()

    service_name = serializers.CharField(
        source="request.service.name",
        read_only=True,
    )

    request_customer = serializers.CharField(
        source="request.customer.email",
        read_only=True,
    )

    request_service_id = serializers.IntegerField(
        source="request.service.id",
        read_only=True,
    )

    request_address = serializers.CharField(
        source="request.address",
        read_only=True,
    )

    request_preferred_date = serializers.DateField(
        source="request.preferred_date",
        read_only=True,
        allow_null=True,
    )

    request_preferred_time = serializers.TimeField(
        source="request.preferred_time",
        read_only=True,
        allow_null=True,
    )

    request_description = serializers.CharField(
        source="request.description",
        read_only=True,
    )

    class Meta:
        model = Quotation

        fields = [
            "id",
            "request",
            "provider",
            "provider_name",
            "service_name",
            "request_customer",
            "request_service_id",
            "request_address",
            "request_preferred_date",
            "request_preferred_time",
            "request_description",
           
            "price",
            "message",
            "counter_price",
            "counter_message",
            "final_message",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "provider",
            "provider_name",
            "service_name",
            "request_customer",
            "counter_price",
            "counter_message",
            "final_message",
            "status",
            "created_at",
        ]

    def get_provider_name(self, obj):

        user = obj.provider.user

        full_name = (
            f"{user.first_name} "
            f"{user.last_name}"
        ).strip()

        return full_name or user.email


# =========================================================
# PROVIDER SERVICE
# =========================================================

class ProviderServiceSerializer(
    serializers.ModelSerializer
):

    service_name = serializers.CharField(
        source="service.name",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="service.category.name",
        read_only=True,
    )

    service_description = serializers.CharField(
        source="service.description",
        read_only=True,
    )

    class Meta:
        model = ProviderService

        fields = [
            "id",
            "provider",
            "service",
            "service_name",
            "category_name",
            "service_description",
              "price_type",
              "price",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "provider",
            "service_name",
            "category_name",
            "service_description",
            "created_at",
        ]


# =========================================================
# PROVIDER MESSAGES
# =========================================================

class MessageSerializer(serializers.ModelSerializer):

    sender_name = serializers.SerializerMethodField()

    receiver_name = serializers.SerializerMethodField()

    content = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Message

        fields = [
            "id",
            "sender",
            "sender_name",
            "receiver",
            "receiver_name",
            "provider",
            "content",
            "image",
            "file",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "sender",
            "sender_name",
            "receiver",
            "receiver_name",
            "is_read",
            "created_at",
        ]

    def get_sender_name(self, obj):

        full_name = (
            f"{obj.sender.first_name} "
            f"{obj.sender.last_name}"
        ).strip()

        return full_name or obj.sender.email

    def get_receiver_name(self, obj):

        full_name = (
            f"{obj.receiver.first_name} "
            f"{obj.receiver.last_name}"
        ).strip()

        return full_name or obj.receiver.email
