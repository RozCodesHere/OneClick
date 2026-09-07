from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.email",
        read_only=True,
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "customer_name",
            "provider",
            "rating",
            "comment",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "customer_name",
            "created_at",
        ]