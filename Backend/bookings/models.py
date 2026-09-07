from django.conf import settings
from django.db import models

from providers.models import ProviderProfile
from services.models import Service


class Booking(models.Model):

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (ACCEPTED, "Accepted"),
        (REJECTED, "Rejected"),
        (COMPLETED, "Completed"),
        (CANCELLED, "Cancelled"),
    ]

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_bookings",
    )

    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name="provider_bookings",
    )

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="bookings",
    )

    booking_date = models.DateField()

    booking_time = models.TimeField()

    address = models.TextField()

    note = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
    )

    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.customer.email} → "
            f"{self.provider.user.email} ({self.status})"
        )