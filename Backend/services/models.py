from django.db import models


class ServiceCategory(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    slug = models.SlugField(
        unique=True,
    )

    icon = models.CharField(
        max_length=100,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Service Categories"

    def __str__(self):
        return self.name


class Service(models.Model):

    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.CASCADE,
        related_name="services",
    )

    name = models.CharField(
        max_length=150,
    )

    description = models.TextField(
        blank=True,
    )

    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    estimated_duration = models.PositiveIntegerField(
        help_text="Duration in minutes",
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ServiceRequest(models.Model):

    STATUS_PENDING = "pending"
    STATUS_QUOTED = "quoted"
    STATUS_ACCEPTED = "accepted"
    STATUS_CANCELLED = "cancelled"
    STATUS_COMPLETED = "completed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_QUOTED, "Quoted"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_COMPLETED, "Completed"),
    ]

    customer = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="service_requests",
    )

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="service_requests",
    )

    description = models.TextField()

    image = models.ImageField(
        upload_to="service_requests/",
        blank=True,
        null=True,
    )

    address = models.CharField(
        max_length=255,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Request #{self.id} - {self.service.name}"


class Quotation(models.Model):

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"
    STATUS_COUNTERED = "countered"
    STATUS_FINAL = "final"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_COUNTERED, "Countered"),
        (STATUS_FINAL, "Final"),
    ]

    request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name="quotations",
    )

    provider = models.ForeignKey(
        "providers.ProviderProfile",
        on_delete=models.CASCADE,
        related_name="quotations",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    message = models.TextField(
        blank=True,
    )

    counter_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    counter_message = models.TextField(
        blank=True,
    )

    final_message = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Quotation #{self.id} "
            f"- Request #{self.request.id}"
        )

# =========================================================
# PROVIDER SERVICES
# =========================================================

class ProviderService(models.Model):

    provider = models.ForeignKey(
        "providers.ProviderProfile",
        on_delete=models.CASCADE,
        related_name="provider_services",
    )

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="provider_services",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["service__name"]

        constraints = [
            models.UniqueConstraint(
                fields=["provider", "service"],
                name="unique_provider_service",
            )
        ]

    def __str__(self):

        return (
            f"{self.provider} - "
            f"{self.service.name}"
        )