from django.db import models
from django.conf import settings


class SupportTicket(models.Model):

    CATEGORY_CHOICES = [
        ("booking", "Booking Issues"),
        ("payment", "Payment Problems"),
        ("provider", "Provider Support"),
        ("account", "Account Help"),
        ("technical", "Technical Problems"),
        ("safety", "Safety & Reporting"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("pending", "Pending"),
        ("resolved", "Resolved"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_tickets"
    )

    subject = models.CharField(max_length=200)

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="other"
    )

    message = models.TextField(max_length=500)

    attachment = models.FileField(
        upload_to="support_attachments/",
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open"
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="medium"
    )

    admin_response = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"TCK-{self.id}: {self.subject}"

    # =========================================================
# PUBLIC CONTACT MESSAGE
# =========================================================

class ContactMessage(models.Model):

    full_name = models.CharField(
        max_length=100
    )

    email = models.EmailField()

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    subject = models.CharField(
        max_length=200
    )

    message = models.TextField(
        max_length=500
    )

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.full_name} - {self.subject}"