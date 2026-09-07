from rest_framework import serializers

from .models import Booking


class BookingSerializer(serializers.ModelSerializer):

    customer_email = serializers.EmailField(
        source="customer.email",
        read_only=True,
    )

    provider_name = serializers.SerializerMethodField()

    service_name = serializers.CharField(
        source="service.name",
        read_only=True,
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "customer_email",
            "provider",
            "provider_name",
            "service",
            "service_name",
            "booking_date",
            "booking_time",
            "address",
            "note",
            "status",
            "total_price",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "customer_email",
            "provider_name",
            "service_name",
            "status",
            "total_price",
            "created_at",
        ]

    def get_provider_name(self, obj):

        first_name = obj.provider.user.first_name
        last_name = obj.provider.user.last_name

        full_name = f"{first_name} {last_name}".strip()

        return full_name or obj.provider.user.email

    def validate(self, attrs):

        if attrs["booking_date"] is None:
            raise serializers.ValidationError(
                {
                    "booking_date":
                    "Booking date is required."
                }
            )

        if attrs["booking_time"] is None:
            raise serializers.ValidationError(
                {
                    "booking_time":
                    "Booking time is required."
                }
            )

        return attrs