from rest_framework import serializers

from .models import Service, ServiceCategory


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