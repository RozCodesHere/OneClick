from django.conf import settings
from django.db import models

from providers.models import ProviderProfile
from services.models import Service


class Booking(models.Model):

    PENDING = "pending"
    ACCEPTED = "accepted"
    ON_THE_WAY = "on_the_way"
    IN_PROGRESS = "in_progress"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (ACCEPTED, "Accepted"),
        (ON_THE_WAY, "Provider On The Way"),
        (IN_PROGRESS, "Service In Progress"),
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

    provider_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    provider_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    note = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
    )
        # Booking workflow timestamps
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    provider_on_way_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    payment_status = models.CharField(
        max_length=20,
        default="unpaid",
    )

    khalti_pidx = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )

    payment_transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
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

class PaymentTransaction(models.Model):

    METHOD_CHOICES = [
        ("khalti", "Khalti"),
        ("cash", "Cash"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="payment_transactions",
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_transactions",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )

    pidx = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
    )
    payment_url = models.URLField(
    blank=True,
    null=True,
)

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Booking #{self.booking.id} - {self.method} - {self.status}"
