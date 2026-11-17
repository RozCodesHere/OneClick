
from django.conf import settings
from django.db import models


class Notification(models.Model):

    # -------------------------------------------------
    # NOTIFICATION CATEGORIES
    # -------------------------------------------------

    BOOKING = "booking"
    QUOTATION = "quotation"
    PAYMENT = "payment"
    CHAT = "chat"
    SERVICE = "service"
    ACCOUNT = "account"
    SUPPORT = "support"
    SYSTEM = "system"

    TYPE_CHOICES = [
        (BOOKING, "Booking"),
        (QUOTATION, "Quotation"),
        (PAYMENT, "Payment"),
        (CHAT, "Chat"),
        (SERVICE, "Service"),
        (ACCOUNT, "Account"),
        (SUPPORT, "Support"),
        (SYSTEM, "System"),
    ]

    # -------------------------------------------------
    # PRIORITY
    # -------------------------------------------------

    NORMAL = "normal"
    MEDIUM = "medium"
    HIGH = "high"

    PRIORITY_CHOICES = [
        (NORMAL, "Normal"),
        (MEDIUM, "Medium"),
        (HIGH, "High"),
    ]

    # -------------------------------------------------
    # RECIPIENT
    # -------------------------------------------------

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    # -------------------------------------------------
    # NOTIFICATION CONTENT
    # -------------------------------------------------

    title = models.CharField(max_length=200)

    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=SYSTEM,
    )

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default=NORMAL,
    )

    # -------------------------------------------------
    # READ STATUS
    # -------------------------------------------------

    is_read = models.BooleanField(default=False)

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # -------------------------------------------------
    # RELATED OBJECT REFERENCES
    # -------------------------------------------------

    related_booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    related_message = models.ForeignKey(
        "services.Message",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # -------------------------------------------------
    # EMAIL DELIVERY TRACKING
    # -------------------------------------------------

    email_sent = models.BooleanField(default=False)

    email_sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # -------------------------------------------------
    # TIMESTAMPS
    # -------------------------------------------------

    created_at = models.DateTimeField(auto_now_add=True)
    # -------------------------------------------------
    # DUPLICATE PREVENTION
    # -------------------------------------------------

    event_key = models.CharField(
    max_length=255,
    null=True,
    blank=True,
    default=None,
)

    
    class Meta:
     ordering = ["-created_at"]

    constraints = [
        models.UniqueConstraint(
            fields=["recipient", "event_key"],
            condition=models.Q(event_key__isnull=False),
            name="unique_notification_per_recipient_event",
        ),
    ]

    def __str__(self):
        return f"{self.recipient.email} - {self.title}"
