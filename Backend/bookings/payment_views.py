import requests

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

        if booking.payment_status == "paid":
            return Response(
                {"error": "This booking is already paid."},
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

            if payment is None:
                payment = PaymentTransaction.objects.create(
                    booking=booking,
                    customer=request.user,
                    amount=booking.total_price,
                    method="khalti",
                    status="pending"
                )

            if payment.payment_url:
                return Response({
                    "message": "Existing payment session reused.",
                    "payment_url": payment.payment_url,
                    "pidx": payment.pidx
                })

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

        if payment.status == "completed":
            return redirect(
                f"{settings.KHALTI_WEBSITE_URL}/payment.html"
                f"?booking_id={payment.booking_id}&payment=success"
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

            response.raise_for_status()
            result = response.json()

            expected_amount = int(payment.amount * 100)

            if (
                result.get("pidx") != pidx
                or result.get("status") != "Completed"
                or result.get("total_amount") != expected_amount
            ):
                return redirect(
                    f"{settings.KHALTI_WEBSITE_URL}/payment.html"
                    f"?booking_id={payment.booking_id}&payment=failed"
                )

            with transaction.atomic():
                locked_payment = PaymentTransaction.objects.select_for_update().get(
                    id=payment.id
                )

                locked_booking = Booking.objects.select_for_update().get(
                    id=locked_payment.booking_id
                )

                if locked_booking.payment_status == "paid":
                    return redirect(
                        f"{settings.KHALTI_WEBSITE_URL}/payment.html"
                        f"?booking_id={payment.booking_id}&payment=failed"
                    )

                locked_payment.status = "completed"
                locked_payment.transaction_id = result.get("transaction_id")
                locked_payment.paid_at = timezone.now()
                locked_payment.save()

                locked_booking.payment_status = "paid"
                locked_booking.payment_transaction_id = result.get(
                    "transaction_id"
                )
                locked_booking.save(
                    update_fields=[
                        "payment_status",
                        "payment_transaction_id"
                    ]
                )

            return redirect(
                f"{settings.KHALTI_WEBSITE_URL}/payment.html"
                f"?booking_id={payment.booking_id}&payment=success"
            )

        except requests.RequestException as error:
            print("KHALTI LOOKUP ERROR:", error)

            return redirect(
                f"{settings.KHALTI_WEBSITE_URL}/payment.html"
                f"?booking_id={payment.booking_id}&payment=failed"
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

        if booking.status != "completed":
            return Response(
                {"error": "Service must be completed first."},
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
