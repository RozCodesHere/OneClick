from rest_framework import serializers

from .models import ProviderProfile, SavedProvider
from services.models import ProviderService


# =========================================================
# PROVIDER SERIALIZER
# =========================================================

class ProviderSerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField()

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    profile_image = serializers.SerializerMethodField()

    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    service_price = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile

        fields = [
            "id",
            "full_name",
            "category",
            "category_name",
            "experience",
            "address",
            "bio",
            "profile_image",
            "hourly_rate",
            "available",
            "verified",
            "rating",
            "review_count",
            "service_price",
            "service_name",
        ]

    # ---------------------------------------------------------
    # FULL NAME
    # ---------------------------------------------------------

    def get_full_name(self, obj):

        return f"{obj.user.first_name} {obj.user.last_name}".strip()

    # ---------------------------------------------------------
    # PROFILE IMAGE
    # ---------------------------------------------------------

    def get_profile_image(self, obj):

        if obj.profile_image:

            request = self.context.get("request")

            if request:
                return request.build_absolute_uri(
                    obj.profile_image.url
                )

            return obj.profile_image.url

        return None

    # ---------------------------------------------------------
    # RATING
    # ---------------------------------------------------------

    def get_rating(self, obj):

        reviews = obj.reviews.all()

        if not reviews.exists():
            return 0.0

        average = sum(
            review.rating
            for review in reviews
        ) / reviews.count()

        return round(average, 1)

    # ---------------------------------------------------------
    # REVIEW COUNT
    # ---------------------------------------------------------

    def get_review_count(self, obj):

        return obj.reviews.count()

    # ---------------------------------------------------------
    # SERVICE PRICE
    # ---------------------------------------------------------

    def get_service_price(self, obj):

        service_id = self.context.get(
            "service_id"
        )

        if not service_id:
            return None

        provider_service = ProviderService.objects.filter(
            provider=obj,
            service_id=service_id,
            is_active=True,
        ).first()

        if not provider_service:
            return None

        return provider_service.price

    # ---------------------------------------------------------
    # SERVICE NAME
    # ---------------------------------------------------------

    def get_service_name(self, obj):

        service_id = self.context.get(
            "service_id"
        )

        if not service_id:
            return None

        provider_service = ProviderService.objects.filter(
            provider=obj,
            service_id=service_id,
            is_active=True,
        ).select_related(
            "service"
        ).first()

        if not provider_service:
            return None

        return provider_service.service.name


# =========================================================
# SAVED PROVIDER SERIALIZER
# =========================================================

class SavedProviderSerializer(serializers.ModelSerializer):

    provider = ProviderSerializer(
        read_only=True
    )

    class Meta:
        model = SavedProvider

        fields = [
            "id",
            "provider",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


# =========================================================
# PROVIDER ONBOARDING SERIALIZER
# =========================================================

class ProviderOnboardingSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProviderProfile

        fields = [
            "category",
            "experience",
            "address",
            "bio",
            "profile_image",
            "hourly_rate",
        ]

    # ---------------------------------------------------------
    # EXPERIENCE VALIDATION
    # ---------------------------------------------------------

    def validate_experience(self, value):

        if value < 0:

            raise serializers.ValidationError(
                "Experience cannot be negative."
            )

        return value

    # ---------------------------------------------------------
    # HOURLY RATE VALIDATION
    # ---------------------------------------------------------

    def validate_hourly_rate(self, value):

        if value <= 0:

            raise serializers.ValidationError(
                "Hourly rate must be greater than 0."
            )

        return value

    # ---------------------------------------------------------
    # CREATE PROVIDER PROFILE
    # ---------------------------------------------------------

    def create(self, validated_data):

        request = self.context["request"]
        user = request.user

        # Prevent duplicate provider profiles
        if ProviderProfile.objects.filter(
            user=user
        ).exists():

            raise serializers.ValidationError(
                "You already have a provider profile."
            )

        # Change user role to provider
        user.role = "provider"

        user.save(
            update_fields=["role"]
        )

        # New providers are NOT verified automatically
        provider = ProviderProfile.objects.create(
            user=user,
            verified=False,
            available=True,
            **validated_data
        )

        return provider