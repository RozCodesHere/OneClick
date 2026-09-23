from rest_framework import serializers

from .models import Booking
from services.models import ProviderService


class BookingSerializer(serializers.ModelSerializer):

    customer_email = serializers.EmailField(
        source="customer.email",
        read_only=True,
    )

    provider_name = serializers.SerializerMethodField()
    provider_image = serializers.SerializerMethodField()
    provider_rating = serializers.SerializerMethodField()
    provider_experience = serializers.SerializerMethodField()

    service_name = serializers.CharField(
        source="service.name",
        read_only=True,
    )

    service_category = serializers.CharField(
        source="service.category.name",
        read_only=True,
    )

    service_price = serializers.SerializerMethodField()

    class Meta:
        model = Booking

        fields = [
            "id",
            "customer_email",

            "provider",
            "provider_name",
            "provider_image",
            "provider_rating",
            "provider_experience",

            "service",
            "service_name",
            "service_category",
            "service_price",

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
            "provider_image",
            "provider_rating",
            "provider_experience",

            "service_name",
            "service_category",
            "service_price",

            "status",
            "total_price",
            "created_at",
        ]

    def get_provider_name(self, obj):

        first_name = obj.provider.user.first_name
        last_name = obj.provider.user.last_name

        full_name = f"{first_name} {last_name}".strip()

        return full_name or obj.provider.user.email

    def get_provider_image(self, obj):

        if obj.provider.profile_image:
            request = self.context.get("request")

            if request:
                return request.build_absolute_uri(
                    obj.provider.profile_image.url
                )

            return obj.provider.profile_image.url

        return None

    def get_provider_rating(self, obj):

        try:
            from reviews.models import Review

            reviews = Review.objects.filter(
                provider=obj.provider
            )

            if not reviews.exists():
                return 0

            total = sum(
                review.rating
                for review in reviews
            )

            return round(
                total / reviews.count(),
                1
            )

        except Exception:
            return 0

    def get_provider_experience(self, obj):

        return obj.provider.experience

    def get_service_price(self, obj):

        provider_service = ProviderService.objects.filter(
            provider=obj.provider,
            service=obj.service,
            is_active=True,
        ).first()

        if not provider_service:
            return None

        return provider_service.price

    def validate(self, attrs):

        provider = attrs.get("provider")
        service = attrs.get("service")

        if attrs.get("booking_date") is None:
            raise serializers.ValidationError({
                "booking_date": "Booking date is required."
            })

        if attrs.get("booking_time") is None:
            raise serializers.ValidationError({
                "booking_time": "Booking time is required."
            })

        if not provider:
            raise serializers.ValidationError({
                "provider": "Provider is required."
            })

        if not service:
            raise serializers.ValidationError({
                "service": "Service is required."
            })

        provider_service = ProviderService.objects.filter(
            provider=provider,
            service=service,
            is_active=True,
        ).first()

        if not provider_service:
            raise serializers.ValidationError({
                "service": (
                    "This provider does not offer the selected service."
                )
            })

        return attrs