from rest_framework import serializers

from .models import ProviderProfile


class ProviderSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    profile_image = serializers.SerializerMethodField()

    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

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
        ]

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()

    def get_profile_image(self, obj):
        if obj.profile_image:
            request = self.context.get("request")

            if request:
                return request.build_absolute_uri(
                    obj.profile_image.url
                )

            return obj.profile_image.url

        return None

    def get_rating(self, obj):
        reviews = obj.reviews.all()

        if not reviews.exists():
            return 0.0

        average = sum(review.rating for review in reviews) / reviews.count()

        return round(average, 1)

    def get_review_count(self, obj):
        return obj.reviews.count()