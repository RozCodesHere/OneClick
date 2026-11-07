from django.conf import settings
from django.db import models

from services.models import ServiceCategory


class ProviderProfile(models.Model):
    # Verification statuses
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

    VERIFICATION_STATUS_CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="provider_profile",
    )

    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.CASCADE,
    )

    experience = models.PositiveIntegerField(
        help_text="Years"
    )

    address = models.CharField(
        max_length=255
    )

    # Service location
    country = models.CharField(
        max_length=100,
        default="Nepal",
    )

    province = models.CharField(
        max_length=100,
        blank=True,
    )

    district = models.CharField(
        max_length=100,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )
    
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    bio = models.TextField(
        blank=True
    )

    profile_image = models.ImageField(
        upload_to="provider_profiles/",
        blank=True,
        null=True,
    )

    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    available = models.BooleanField(
        default=True
    )
    availability_status = models.CharField(
        max_length=20,
        choices=[
            ("available", "Available Today"),
            ("unavailable", "Unavailable"),
            ("vacation", "Vacation Mode"),
        ],
        default="available",
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default=PENDING,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.user.email

class ProviderWorkPhoto(models.Model):

    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name="work_photos",
    )

    image = models.ImageField(
        upload_to="provider_work_photos/",
    )

    caption = models.CharField(
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"Work photo - {self.provider.user.email}"
    
class SavedProvider(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_providers",
    )

    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name="saved_by",
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "provider"],
                name="unique_saved_provider",
            )
        ]

    def __str__(self):
        return f"{self.customer.email} saved {self.provider.user.email}"
