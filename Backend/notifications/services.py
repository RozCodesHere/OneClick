
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError
from django.utils import timezone

from .models import Notification


logger = logging.getLogger(__name__)


def _email_is_enabled(user, notification_type):
    """
    Check the user's email and relevant notification preferences.
    """

    preferences = user.notification_preferences or {}

    # Global email preference.
    if not preferences.get("email", True):
        return False

    # Booking-related notification preference.
    booking_types = {
        Notification.BOOKING,
        Notification.QUOTATION,
        Notification.PAYMENT,
        Notification.SERVICE,
    }

    if notification_type in booking_types:
        if not preferences.get("bookings", True):
            return False

    return True


def _send_notification_email(notification):
    """
    Send an email without affecting the saved in-app notification.
    """

    user = notification.recipient

    if not user.email:
        return

    try:
        sent_count = send_mail(
            subject=notification.title,
            message=notification.message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        if sent_count == 1:
            notification.email_sent = True
            notification.email_sent_at = timezone.now()

            notification.save(
                update_fields=[
                    "email_sent",
                    "email_sent_at",
                ]
            )

    except Exception:
        logger.exception(
            "Notification email failed. Notification ID: %s",
            notification.id,
        )


def create_notification(
    recipient,
    title,
    message,
    notification_type=Notification.SYSTEM,
    priority=Notification.NORMAL,
    event_key=None,
    related_booking=None,
    send_email=True,
):
    """
    Create an in-app notification and optionally send an email.

    Chat notifications are deliberately excluded.
    """

    if notification_type == Notification.CHAT:
        raise ValueError(
            "Chat messages must remain inside the OneClick chat system."
        )

    if event_key is not None:
        event_key = str(event_key).strip()

        if not event_key:
            raise ValueError("event_key cannot be empty.")

    notification_data = {
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "priority": priority,
        "related_booking": related_booking,
    }

    try:
        if event_key:
            notification, created = Notification.objects.get_or_create(
                recipient=recipient,
                event_key=event_key,
                defaults=notification_data,
            )
        else:
            notification = Notification.objects.create(
                recipient=recipient,
                **notification_data,
            )
            created = True

    except IntegrityError:
        # Protect against simultaneous duplicate event creation.
        if not event_key:
            raise

        notification = Notification.objects.get(
            recipient=recipient,
            event_key=event_key,
        )
        created = False

    # Never send another email for an existing event.
    if (
        created
        and send_email
        and _email_is_enabled(recipient, notification_type)
    ):
        from django.db import transaction

        transaction.on_commit(
            lambda: _send_notification_email(notification)
        )

    return notification



def notify_provider_fully_verified(provider_profile):
    """
    Notify a provider only after both KYC and provider
    application approvals are complete.
    """

    from providers.models import ProviderKYC, ProviderProfile

    if provider_profile.verification_status != ProviderProfile.APPROVED:
        return None

    kyc_approved = ProviderKYC.objects.filter(
        provider=provider_profile,
        status=ProviderKYC.APPROVED,
    ).exists()

    if not kyc_approved:
        return None

    return create_notification(
        recipient=provider_profile.user,
        title="OneClick Provider Verification Approved",
        message=(
            "Congratulations! Your identity documents and "
            "provider application have both been approved. "
            "Your OneClick provider account is now verified."
        ),
        notification_type=Notification.SYSTEM,
        priority=Notification.HIGH,
        event_key=f"provider:{provider_profile.id}:fully_verified",
        send_email=True,
    )