from django.conf import settings
from django.db import models

from services.models import ServiceCategory


class ProviderProfile(models.Model):
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

    verified = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.user.email


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