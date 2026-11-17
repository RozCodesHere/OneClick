
from rest_framework import serializers

from .models import ProviderProfile, SavedProvider, ProviderWorkPhoto
from services.models import ProviderService, Service
from reviews.serializers import ReviewSerializer

# =========================================================
# PROVIDER SERIALIZER
# =========================================================

class ProviderWorkPhotoSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProviderWorkPhoto
        fields = ["id", "image", "caption", "created_at"]


# =========================================================
# PROVIDER SERIALIZER
# =========================================================

class ProviderSerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    phone = serializers.CharField(
        source="user.phone",
        read_only=True,
    )

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    profile_image = serializers.SerializerMethodField()

    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    service_price = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    work_photos = serializers.SerializerMethodField()
    completed_jobs = serializers.SerializerMethodField()
    happy_customers = serializers.SerializerMethodField()
    repeat_customers = serializers.SerializerMethodField()
    average_response_time = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    class Meta:
        model = ProviderProfile

        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "category",
            "category_name",
            "experience",
            "address",
            "country",
            "province",
             "district",
              "city",
            "latitude",
            "longitude",
            "bio",
            "profile_image",
            "hourly_rate",
            "available",
            "availability_status",
            "verification_status",
             "is_verified",
            "rating",
            "review_count",
            "reviews",
            "service_price",
            "service_name",
            "services",
            "work_photos",
            "completed_jobs",
            "happy_customers",
            "repeat_customers",
            "average_response_time",
          
        ]

        read_only_fields = [
            "verification_status",
        ]

    # ---------------------------------------------------------
    # FULL NAME
    # ---------------------------------------------------------

    def get_full_name(self, obj):

        return f"{obj.user.first_name} {obj.user.last_name}".strip()


       # ---------------------------------------------------------
    # COMBINED PROVIDER VERIFICATION (APPLICATION + KYC)
    # ---------------------------------------------------------

    def get_is_verified(self, obj):

        from .models import ProviderKYC

        return (
            obj.verification_status == ProviderProfile.APPROVED
            and ProviderKYC.objects.filter(
                provider=obj,
                status=ProviderKYC.APPROVED,
            ).exists()
        )



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
    # PROVIDER REVIEWS
    # ---------------------------------------------------------

    def get_reviews(self, obj):
        reviews = obj.reviews.all()

        return ReviewSerializer(
            reviews,
            many=True,
            context=self.context
        ).data

    
    # ---------------------------------------------------------
    # PROVIDER STATISTICS
    # ---------------------------------------------------------

    def get_completed_jobs(self, obj):
        return obj.provider_bookings.filter(
            status="completed"
        ).count()

    def get_happy_customers(self, obj):
        return obj.provider_bookings.filter(
            status="completed"
        ).values("customer").distinct().count()

    def get_repeat_customers(self, obj):
        from django.db.models import Count

        return (
            obj.provider_bookings
            .filter(status="completed")
            .values("customer")
            .annotate(total=Count("id"))
            .filter(total__gt=1)
            .count()
        )

    def get_average_response_time(self, obj):
        from django.db.models import Avg, F, ExpressionWrapper, DurationField

        average = (
            obj.provider_bookings
            .filter(accepted_at__isnull=False)
            .annotate(
                response_time=ExpressionWrapper(
                    F("accepted_at") - F("created_at"),
                    output_field=DurationField(),
                )
            )
            .aggregate(avg=Avg("response_time"))["avg"]
        )

        if average is None:
            return None

        minutes = round(average.total_seconds() / 60)

        if minutes < 60:
            return f"{minutes} min"

        return f"{minutes / 60:.1f} hrs"

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

    # ---------------------------------------------------------
    # ALL PROVIDER SERVICES
    # ---------------------------------------------------------

           # ---------------------------------------------------------
    # WORK PHOTOS
    # ---------------------------------------------------------

    def get_work_photos(self, obj):

        photos = obj.work_photos.all()

        return ProviderWorkPhotoSerializer(
            photos,
            many=True,
            context=self.context
        ).data

    # ---------------------------------------------------------
    # ALL PROVIDER SERVICES
    # ---------------------------------------------------------

    def get_services(self, obj):

        provider_services = (
            ProviderService.objects
            .filter(
                provider=obj,
                is_active=True,
                service__is_active=True,
            )
            .select_related(
                "service",
                "service__category",
            )
        )

        
        return [
    {
        "id": provider_service.service.id,
        "name": provider_service.service.name,
        "category_id": (
            provider_service.service.category.id
            if provider_service.service.category
            else None
        ),
        "category_name": (
            provider_service.service.category.name
            if provider_service.service.category
            else None
        ),
        "price": provider_service.price,
        "price_type": provider_service.price_type,
    }
    for provider_service in provider_services
]


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

    services = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        many=True,
        write_only=True,
        required=True,
    )

    class Meta:
        model = ProviderProfile

        fields = [
            "services",
            "category",
            "experience",
            "address",
            "country",
"province",
"district",
"city",
            "latitude",
            "longitude",
            "bio",
            "profile_image",
            "hourly_rate",
        ]


    extra_kwargs = {
    "category": {
        "required": False,
    },
    "country": {
        "required": True,
    },
    "province": {
        "required": True,
    },
    "district": {
        "required": True,
    },
    "city": {
        "required": False,
        "allow_blank": True,
    },
}

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
    # SERVICES VALIDATION
    # ---------------------------------------------------------

    def validate_services(self, value):

        if not value:

            raise serializers.ValidationError(
                "Please select at least one service."
            )

        return value

    # ---------------------------------------------------------
    # CREATE PROVIDER PROFILE + SERVICES
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

        # Get selected services
        services = validated_data.pop(
            "services"
        )

        # Make sure at least one service exists
        if not services:

            raise serializers.ValidationError(
                "Please select at least one service."
            )

        # Use the first selected service's category
        # as the provider's primary category.
        primary_category = services[0].category

        # Set primary category automatically
        validated_data["category"] = primary_category

        # Change user role to provider
        user.role = "provider"

        user.save(
            update_fields=["role"]
        )

        # Create provider profile.
        #
        # New providers always start as PENDING.
        # The admin must explicitly approve or reject them.
        provider = ProviderProfile.objects.create(
            user=user,
            verification_status=ProviderProfile.PENDING,
            available=True,
            **validated_data
        )

        # Create one ProviderService for every
        # selected service.
        for service in services:

            ProviderService.objects.create(
                provider=provider,
                service=service,
                price=service.base_price,
                is_active=True,
            )

        return provider
