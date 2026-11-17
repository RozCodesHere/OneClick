import requests
from datetime import timedelta
from providers.models import ProviderProfile
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.shortcuts import redirect
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, PaymentTransaction
from notifications.models import Notification
from notifications.services import create_notification



class KhaltiInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        if not booking_id:
            return Response(
                {"error": "Booking ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            booking = Booking.objects.get(
                id=booking_id,
                customer=request.user
            )
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.status != "completed":
            return Response(
                {"error": "Booking must be completed first."},
                status=status.HTTP_400_BAD_REQUEST
            )

                # Negotiable bookings require an approved final price.
        if (
            booking.price_type == Booking.PRICE_NEGOTIABLE
            and booking.price_approval_status != "approved"
        ):
            return Response(
                {
                    "error": (
                        "The negotiated price must be approved "
                        "before selecting cash payment."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        

        if booking.payment_status == "paid":
            return Response(
                {"error": "This booking is already paid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.payment_method == "cash":
         return Response(
        {
            "error": (
                "Cash payment has already been selected "
                "for this booking. Khalti payment is not available."
            )
        },
        status=status.HTTP_400_BAD_REQUEST
    )



        if not settings.KHALTI_SECRET_KEY:
            return Response(
                {"error": "Khalti sandbox key is not configured yet."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        amount = int(Decimal(str(booking.total_price)) * 100)

        if amount < 1000:
            return Response(
                {"error": "Minimum Khalti payment is Rs. 10."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(
                id=booking.id
            )

            if booking.payment_status == "paid":
                return Response(
                    {"error": "This booking is already paid."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment = PaymentTransaction.objects.filter(
                booking=booking,
                method="khalti",
                status="pending"
            ).order_by("-created_at").first()

            if payment is not None:
                session_age = timezone.now() - payment.created_at

                # Reuse only a recent session with a payment URL.
                if (
                    payment.payment_url
                    and session_age < timedelta(minutes=25)
                ):
                    return Response({
                        "message": "Existing payment session reused.",
                        "payment_url": payment.payment_url,
                        "pidx": payment.pidx
                    })

                # Preserve old transaction history.
                if (
                    session_age >= timedelta(minutes=25)
                    or payment.pidx
                ):
                    payment.status = "failed"
                    payment.save(update_fields=["status"])
                    payment = None

            if payment is None:
                payment = PaymentTransaction.objects.create(
                    booking=booking,
                    customer=request.user,
                    amount=booking.total_price,
                    method="khalti",
                    status="pending"
                )

        payload = {
            "return_url": settings.KHALTI_RETURN_URL,
            "website_url": settings.KHALTI_WEBSITE_URL,
            "amount": amount,
            "purchase_order_id": f"ONECLICK-{booking.id}-{payment.id}",
            "purchase_order_name": f"OneClick Booking #{booking.id}",
            "amount_breakdown": [
                {
                    "label": f"OneClick Booking #{booking.id}",
                    "amount": amount
                }
            ],
            "product_details": [
                {
                    "identity": str(booking.id),
                    "name": f"OneClick Booking #{booking.id}",
                    "total_price": amount,
                    "quantity": 1,
                    "unit_price": amount
                }
            ]
        }

        headers = {
            "Authorization": f"Key {settings.KHALTI_SECRET_KEY}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(
                f"{settings.KHALTI_API_BASE_URL.rstrip('/')}/epayment/initiate/",
                json=payload,
                headers=headers,
                timeout=20
            )

            response.raise_for_status()
            result = response.json()

            pidx = result.get("pidx")
            payment_url = result.get("payment_url")

            if not pidx or not payment_url:
                raise ValueError("Invalid Khalti response.")

            payment.pidx = pidx
            payment.payment_url = payment_url
            payment.save(update_fields=["pidx", "payment_url"])

            booking.khalti_pidx = pidx
            booking.save(update_fields=["khalti_pidx"])

            return Response({
                "message": "Payment initiated successfully.",
                "payment_url": payment_url,
                "pidx": pidx
            })

        except (requests.RequestException, ValueError) as error:
            payment.status = "failed"
            payment.save(update_fields=["status"])

            create_notification(
                recipient=booking.customer,
                title="Khalti Payment Could Not Be Started",
                message=(
                    f"We couldn't start your Khalti payment "
                    f"for booking #{booking.id}. Please try again."
                ),
                notification_type=Notification.PAYMENT,
                event_key=(
                    f"booking:{booking.id}:payment:"
                    f"khalti:initiation_failed:{payment.id}:customer"
                ),
                related_booking=booking,
            )

            print("KHALTI INITIATION ERROR:", error)

            return Response(
                {"error": "Unable to initiate Khalti payment."},
                status=status.HTTP_502_BAD_GATEWAY
            )





class KhaltiReturnView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        pidx = request.query_params.get("pidx")

        if not pidx:
            return Response(
                {"error": "Payment reference is missing."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment = PaymentTransaction.objects.select_related(
                "booking"
            ).get(pidx=pidx, method="khalti")

        except PaymentTransaction.DoesNotExist:
            return Response(
                {"error": "Payment record not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        payment_url = (
            f"{settings.KHALTI_WEBSITE_URL}/payment.html"
            f"?booking_id={payment.booking_id}"
        )

        headers = {
            "Authorization": f"Key {settings.KHALTI_SECRET_KEY}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(
                f"{settings.KHALTI_API_BASE_URL.rstrip('/')}/epayment/lookup/",
                json={"pidx": pidx},
                headers=headers,
                timeout=20
            )

            result = response.json()

            print("KHALTI LOOKUP RESULT:", result)

            response.raise_for_status()

            khalti_status = str(
                result.get("status", "")
            ).strip().lower()

            terminal_statuses = {
                "expired",
                "user canceled",
                "user cancelled",
                "canceled",
                "cancelled",
            }

            expected_amount = int(payment.amount * 100)

            # Verify the payment reference and amount.
            if (
                result.get("pidx") != pidx
                or result.get("total_amount") != expected_amount
            ):
                print("KHALTI PAYMENT VERIFICATION MISMATCH")
                return redirect(f"{payment_url}&payment=failed")

            # Handle unsuccessful terminal states.
            if khalti_status in terminal_statuses:
                PaymentTransaction.objects.filter(
                    id=payment.id,
                    status="pending"
                ).update(status="failed")

                return redirect(f"{payment_url}&payment=failed")

            # Pending payments are not successful or failed yet.
            if khalti_status in {"pending", "initiated"}:
                return redirect(f"{payment_url}&payment=pending")

            # Unknown statuses must never be treated as successful.
            if khalti_status != "completed":
                print("UNRECOGNIZED KHALTI STATUS:", khalti_status)
                return redirect(f"{payment_url}&payment=pending")

            # A completed payment must have a gateway transaction ID.
            gateway_transaction_id = result.get("transaction_id")

            if not gateway_transaction_id:
                print("KHALTI TRANSACTION ID MISSING")
                return redirect(f"{payment_url}&payment=pending")

            with transaction.atomic():
                locked_payment = PaymentTransaction.objects.select_for_update().get(
                    id=payment.id
                )

                locked_booking = Booking.objects.select_for_update().get(
                    id=locked_payment.booking_id
                )

                # Repeated callback for an already completed transaction.
                if locked_payment.status == "completed":
                    if (
                        locked_payment.transaction_id == gateway_transaction_id
                        and locked_booking.payment_status == "paid"
                        and locked_booking.payment_transaction_id
                        == gateway_transaction_id
                    ):
                        return redirect(f"{payment_url}&payment=success")

                    return redirect(f"{payment_url}&payment=conflict")

                                # Recheck negotiated-price approval before recording payment.
                if (
                    locked_booking.price_type == Booking.PRICE_NEGOTIABLE
                    and locked_booking.price_approval_status != "approved"
                ):
                    locked_payment.status = "conflict"
                    locked_payment.transaction_id = gateway_transaction_id
                    locked_payment.paid_at = timezone.now()
                    locked_payment.save(
                        update_fields=[
                            "status",
                            "transaction_id",
                            "paid_at",
                        ]
                    )

                    print(
                        "KHALTI PRICE APPROVAL CONFLICT:",
                        f"Booking #{locked_booking.id}",
                    )

                    return redirect(f"{payment_url}&payment=conflict")

                # Check whether another payment has already paid this booking.
                if locked_booking.payment_status == "paid":
                    locked_payment.status = "conflict"
                    locked_payment.transaction_id = gateway_transaction_id
                    locked_payment.paid_at = timezone.now()
                    locked_payment.save(
                        update_fields=[
                            "status",
                            "transaction_id",
                            "paid_at",
                        ]
                    )

                    print(
                        "KHALTI PAYMENT CONFLICT:",
                        f"Booking #{locked_booking.id}",
                        f"Gateway transaction: {gateway_transaction_id}"
                    )

                    return redirect(f"{payment_url}&payment=conflict")

                # Record the verified gateway transaction normally.
                locked_payment.status = "completed"
                locked_payment.transaction_id = gateway_transaction_id
                locked_payment.paid_at = timezone.now()
                locked_payment.save(
                    update_fields=[
                        "status",
                        "transaction_id",
                        "paid_at"
                    ]
                )

                locked_booking.payment_status = "paid"
                locked_booking.payment_method = "khalti"
                locked_booking.payment_transaction_id = gateway_transaction_id
                locked_booking.khalti_pidx = pidx

                locked_booking.save(
                    update_fields=[
                        "payment_status",
                        "payment_method",
                        "payment_transaction_id",
                        "khalti_pidx"
                    ]
                )

            create_notification(
                    recipient=locked_booking.customer,
                    title="Payment Successful",
                    message=(
                        f"Your Khalti payment for booking "
                        f"#{locked_booking.id} was successful."
                    ),
                    notification_type=Notification.PAYMENT,
                    event_key=(
                        f"booking:{locked_booking.id}:"
                        "payment:khalti:success:customer"
                    ),
                    related_booking=locked_booking,
                )

            create_notification(
                    recipient=locked_booking.provider.user,
                    title="Customer Payment Received",
                    message=(
                        f"Payment for booking #{locked_booking.id} "
                        "has been successfully received through Khalti."
                    ),
                    notification_type=Notification.PAYMENT,
                    event_key=(
                        f"booking:{locked_booking.id}:"
                        "payment:khalti:success:provider"
                    ),
                    related_booking=locked_booking,
                )

            return redirect(f"{payment_url}&payment=success")

        except (requests.RequestException, ValueError) as error:
            print("KHALTI LOOKUP ERROR:", error)

            # A lookup error does not prove that payment failed.
            return redirect(f"{payment_url}&payment=pending")




class CashPaymentSelectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        if not booking_id:
            return Response(
                {"error": "Booking ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user.role != "customer":
            return Response(
                {"error": "Only customers can select cash payment."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            with transaction.atomic():
                booking = Booking.objects.select_for_update().get(
                    id=booking_id,
                    customer=request.user
                )

                if booking.status != "completed":
                    return Response(
                        {"error": "Booking must be completed first."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if booking.payment_status == "paid":
                    return Response(
                        {"error": "This booking is already paid."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Expire old pending Khalti sessions after 25 minutes.
                stale_khalti_sessions = PaymentTransaction.objects.filter(
                    booking=booking,
                    method="khalti",
                    status="pending",
                    created_at__lt=timezone.now() - timedelta(minutes=25)
                )

                stale_khalti_sessions.update(status="failed")

                # Block cash if a recent Khalti session is still pending.
                pending_khalti = PaymentTransaction.objects.filter(
                    booking=booking,
                    method="khalti",
                    status="pending"
                ).exists()

                if pending_khalti:
                    return Response(
                        {
                            "error": (
                                "A recent Khalti payment session is still pending. "
                                "Please finish it before selecting cash."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                booking.payment_method = "cash"
                booking.save(update_fields=["payment_method"])

                return Response({
                    "message": "Cash payment selected successfully.",
                    "payment_method": booking.payment_method,
                    "payment_status": booking.payment_status
                })

        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND
            )



class CashPaymentConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can confirm cash payments."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            provider = ProviderProfile.objects.get(user=request.user)

            booking = Booking.objects.get(
                id=booking_id,
                provider=provider
            )

        except (ProviderProfile.DoesNotExist, Booking.DoesNotExist):
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        with transaction.atomic():

            booking = Booking.objects.select_for_update().get(
                id=booking.id,
                provider=provider
            )

            if booking.status != "completed":
                return Response(
                    {"error": "Service must be completed first."},
                    status=status.HTTP_400_BAD_REQUEST
                )

 # Negotiable bookings require customer-approved pricing.
            if (
                booking.price_type == Booking.PRICE_NEGOTIABLE
                and booking.price_approval_status != "approved"
            ):
              return Response(
        {
            "error": (
                "The negotiated price must be approved "
                "before confirming cash payment."
            )
        },
        status=status.HTTP_400_BAD_REQUEST
    )

            if booking.payment_status == "paid":
                return Response(
                    {"error": "This booking is already paid."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if booking.payment_method != "cash":
                return Response(
                    {
                        "error": (
                            "The customer has not selected cash payment "
                            "for this booking."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Do not confirm cash while a recent Khalti session is pending.
            recent_pending_khalti = PaymentTransaction.objects.filter(
                booking=booking,
                method="khalti",
                status="pending",
                created_at__gte=timezone.now() - timedelta(minutes=25)
            ).exists()

            if recent_pending_khalti:
                return Response(
                    {
                        "error": (
                            "A recent Khalti payment is still pending. "
                            "Please resolve that payment before confirming cash."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment = PaymentTransaction.objects.create(
                booking=booking,
                customer=booking.customer,
                amount=booking.total_price,
                method="cash",
                status="completed",
                paid_at=timezone.now()
            )

            payment.transaction_id = (
                f"CASH-BOOKING-{booking.id}-{payment.id}"
            )

            payment.save(update_fields=["transaction_id"])

            booking.payment_status = "paid"
            booking.payment_transaction_id = payment.transaction_id

            booking.save(
                update_fields=[
                    "payment_status",
                    "payment_transaction_id"
                ]
            )

        # Notify customer about cash payment confirmation.
        create_notification(
            recipient=booking.customer,
            title="Cash Payment Confirmed",
            message=(
                f"Your cash payment for booking #{booking.id} "
                f"has been confirmed by the provider."
            ),
            notification_type=Notification.PAYMENT,
            event_key=f"booking:{booking.id}:payment:cash:success:customer",
            related_booking=booking,
        )

        # Notify provider about the recorded payment.
        create_notification(
            recipient=booking.provider.user,
            title="Cash Payment Recorded",
            message=(
                f"Cash payment for booking #{booking.id} "
                f"has been successfully recorded."
            ),
            notification_type=Notification.PAYMENT,
            event_key=f"booking:{booking.id}:payment:cash:success:provider",
            related_booking=booking,
        )

        return Response({
            "message": "Demo cash payment confirmed by provider.",
            "payment_status": "paid",
            "transaction_id": payment.transaction_id
        })



class ProviderTransactionHistoryView(APIView):
     permission_classes = [IsAuthenticated]

     def get(self, request):

        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can view transactions."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            provider = ProviderProfile.objects.get(
                user=request.user
            )
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        payments = PaymentTransaction.objects.filter(
            booking__provider=provider
        ).select_related(
            "booking",
            "customer"
        ).order_by("-created_at")

        data = [
            {
                "id": payment.id,
                "booking_id": payment.booking_id,
                "customer_name": (
                    payment.customer.get_full_name()
                    or payment.customer.email
                ),
                "amount": payment.amount,
                "method": payment.method,
                "status": payment.status,
                "transaction_id": payment.transaction_id,
                "created_at": payment.created_at,
                "paid_at": payment.paid_at,
            }
            for payment in payments
        ]

        return Response(data)



class AdminTransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        payments = PaymentTransaction.objects.select_related(
            "booking",
            "customer",
            "booking__provider__user",
            "booking__service",
        ).order_by("-created_at")

        data = [
            {
                "id": payment.id,
                "booking_id": payment.booking_id,

                "customer_name": (
                    payment.customer.get_full_name()
                    or payment.customer.email
                ),

                "provider_name": (
                    payment.booking.provider.user.get_full_name()
                    or payment.booking.provider.user.email
                ),

                "service_name": payment.booking.service.name,

                "amount": payment.amount,
                "method": payment.method,
                "status": payment.status,
                "transaction_id": payment.transaction_id,
                "pidx": payment.pidx,
                "created_at": payment.created_at,
                "paid_at": payment.paid_at,
            }
            for payment in payments
        ]

        return Response(data)
