from django.conf import settings
from django.db import models
from bookings.models import Booking

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

    booking = models.ForeignKey(
    Booking,
    on_delete=models.CASCADE,
    related_name="review",
    null=True,
    blank=True,
)

    rating = models.PositiveSmallIntegerField()

    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

        unique_together = (
    "booking",
)
    def __str__(self):
        return f"{self.customer.email} - {self.rating}"
