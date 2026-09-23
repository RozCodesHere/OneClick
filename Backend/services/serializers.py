from rest_framework import serializers

from .models import (
    Service,
    ServiceCategory,
    ServiceRequest,
    Quotation,
    ProviderService,
)


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

    class Meta:
        model = Quotation

        fields = [
            "id",
            "request",
            "provider",
            "provider_name",
            "service_name",
            "request_customer",
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