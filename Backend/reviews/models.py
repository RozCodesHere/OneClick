from django.conf import settings
from django.db import models

from providers.models import ProviderProfile


class Review(models.Model):

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )

    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name="reviews",
    )

    rating = models.PositiveSmallIntegerField()

    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

        unique_together = (
            "customer",
            "provider",
        )

    def __str__(self):
        return f"{self.customer.email} - {self.rating}"