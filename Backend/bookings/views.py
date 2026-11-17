
from rest_framework import status
from users.models import User
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime
from decimal import Decimal, InvalidOperation
from providers.models import ProviderProfile, ProviderKYC
from services.models import ProviderService, Quotation

from .models import Booking, PaymentTransaction
from .serializers import BookingSerializer
from notifications.models import Notification
from notifications.services import create_notification


def expire_overdue_bookings():

    current_datetime = timezone.now()

    overdue_bookings = Booking.objects.filter(
        status__in=[
            Booking.PENDING,
            Booking.ACCEPTED,
        ]
    ).select_related(
        "customer",
        "provider__user",
    )

    for booking in overdue_bookings:

        scheduled_datetime = timezone.make_aware(
            datetime.combine(
                booking.booking_date,
                booking.booking_time,
            ),
            timezone.get_current_timezone(),
        )

        if current_datetime >= scheduled_datetime:

            booking.status = Booking.EXPIRED

            booking.save(
                update_fields=["status", "updated_at"]
            )

            create_notification(
                recipient=booking.customer,
                title="Booking Expired",
                message=(
                    f"Your booking #{booking.id} has expired "
                    "because the provider did not start the journey "
                    "before the scheduled time."
                ),
                notification_type=Notification.BOOKING,
                event_key=f"booking:{booking.id}:expired:customer",
                related_booking=booking,
            )

            create_notification(
                recipient=booking.provider.user,
                title="Booking Expired",
                message=(
                    f"Booking #{booking.id} has expired because "
                    "the journey was not started before the "
                    "scheduled time."
                ),
                notification_type=Notification.BOOKING,
                event_key=f"booking:{booking.id}:expired:provider",
                related_booking=booking,
            )

class BookingListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        expire_overdue_bookings()

        bookings = Booking.objects.filter(
            customer=request.user
        ).order_by("-created_at")

        serializer = BookingSerializer(
            bookings,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = BookingSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider = serializer.validated_data["provider"]
        service = serializer.validated_data["service"]

        # Only approved providers can receive bookings.
        if provider.verification_status != ProviderProfile.APPROVED:
            return Response(
                {
                    "error": (
                        "This provider is not verified "
                        "and cannot receive bookings."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )


        # Provider must also have approved KYC documents.
        kyc_approved = ProviderKYC.objects.filter(
            provider=provider,
            status=ProviderKYC.APPROVED,
        ).exists()

        if not kyc_approved:
            return Response(
                {
                    "error": (
                        "This provider's identity verification "
                        "is not approved and cannot receive bookings."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        
        # Provider must be available.
        if not provider.available:
            return Response(
                {"error": "This provider is currently unavailable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Confirm that the provider offers this service.
        provider_service = ProviderService.objects.filter(
            provider=provider,
            service=service,
            is_active=True,
        ).first()

        if not provider_service:
            return Response(
                {
                    "error": (
                        "This provider does not offer "
                        "the selected service."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

 # Check whether this booking comes from an accepted quotation.
        quotation_id = request.data.get("quotation_id")

        if quotation_id is not None:

            quotation = Quotation.objects.filter(
                id=quotation_id,
                request__customer=request.user,
                provider=provider,
                request__service=service,
                status=Quotation.STATUS_ACCEPTED,
            ).first()

            if not quotation:
                return Response(
                    {
                        "error": (
                            "No valid accepted quotation was found "
                            "for this booking."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

# An accepted quotation already has an agreed price.
            booking_price = quotation.price
            booking_price_type = Booking.PRICE_FIXED
            approval_status = "not_required"

        elif provider_service.price_type == ProviderService.PRICE_NEGOTIABLE:

            # The final price will be proposed after inspection.
            booking_price = 0
            booking_price_type = Booking.PRICE_NEGOTIABLE
            approval_status = "pending"

        else:

            # Preserve existing fixed-price booking behaviour.
            booking_price = provider_service.price
            booking_price_type = Booking.PRICE_FIXED
            approval_status = "not_required"

        
        booking = serializer.save(
            customer=request.user,
            total_price=booking_price,
            price_type=booking_price_type,
            price_approval_status=approval_status,
        )

        # Notify all active Admin accounts.
        admin_users = User.objects.filter(
            role=User.ADMIN,
            is_active=True,
        )

        for admin_user in admin_users:
            create_notification(
                recipient=admin_user,
                title="New Booking Created",
                message=(
                    f"A new booking #{booking.id} was created by "
                    f"{booking.customer.email} for "
                    f"{booking.service.name if booking.service else 'a service'}."
                ),
                notification_type=Notification.BOOKING,
                priority=Notification.MEDIUM,
                event_key=f"booking:{booking.id}:created:admin:{admin_user.id}",
                related_booking=booking,
            )

        # Notify the customer.
        create_notification(
            recipient=booking.customer,
            title="Booking Submitted",
            message=(
                f"Your booking #{booking.id} has been submitted "
                f"for {booking.booking_date} at {booking.booking_time}."
            ),
            notification_type=Notification.BOOKING,
            event_key=f"booking:{booking.id}:submitted:customer",
            related_booking=booking,
        )

        # Notify the provider.
        create_notification(
            recipient=booking.provider.user,
            title="New Booking Request",
            message=(
                f"You have received a new booking request "
                f"#{booking.id} for {booking.booking_date} "
                f"at {booking.booking_time}."
            ),
            notification_type=Notification.BOOKING,
            event_key=f"booking:{booking.id}:submitted:provider",
            related_booking=booking,
        )

        return Response(
            BookingSerializer(
                booking,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )






class BookingDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        if request.user.role == "customer":
            booking = Booking.objects.filter(
                id=pk,
                customer=request.user,
            ).first()

        elif request.user.role == "provider":
            booking = Booking.objects.filter(
                id=pk,
                provider__user=request.user,
            ).first()

        else:
            return Response(
                {"error": "You are not allowed to view this booking."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        expire_overdue_bookings()

        booking.refresh_from_db()

        serializer = BookingSerializer(
            booking,
            context={"request": request},
        )

        return Response(serializer.data)

    def patch(self, request, pk):

        booking = self.get_object(request, pk)

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.data.get("status") != "cancelled":
            return Response(
                {"error": "You can only cancel a booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status == "completed":
            return Response(
                {
                    "error": (
                        "Completed bookings cannot be cancelled."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "cancelled"
        booking.save()
                # Notify the provider when the customer cancels.
        create_notification(
            recipient=booking.provider.user,
            title="Booking Cancelled",
            message=(
                f"The customer has cancelled booking #{booking.id}."
            ),
            notification_type=Notification.BOOKING,
            event_key=f"booking:{booking.id}:cancelled:provider",
            related_booking=booking,
        )

        
        serializer = BookingSerializer(
            booking,
            context={"request": request},
        )

        return Response(serializer.data)

    def delete(self, request, pk):

        booking = self.get_object(request, pk)

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.status not in ["cancelled", "rejected"]:
            return Response(
                {
                    "error": (
                        "Only cancelled or rejected bookings "
                        "can be deleted."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )



class ProviderBookingListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "provider":
            return Response(
                {
                    "error": (
                        "Only providers can access "
                        "this endpoint."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        expire_overdue_bookings()
        bookings = Booking.objects.filter(
            provider__user=request.user
        ).order_by("-created_at")

        serializer = BookingSerializer(
            bookings,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)


class ProviderBookingActionView(APIView):

    permission_classes = [IsAuthenticated]

    
    def patch(self, request, pk):

        if request.user.role != "provider":
            return Response(
                {
                    "error": (
                        "Only providers can perform "
                        "this action."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        expire_overdue_bookings()
        booking = Booking.objects.filter(
            id=pk,
            provider__user=request.user,
        ).first()

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")

        # ACCEPTING and STARTING THE JOURNEY must happen
        # before the scheduled booking date and time.
        if new_status in ["accepted", "on_the_way"]:

            scheduled_datetime = timezone.make_aware(
                datetime.combine(
                    booking.booking_date,
                    booking.booking_time
                ),
                timezone.get_current_timezone()
            )

            current_datetime = timezone.now()

            if current_datetime >= scheduled_datetime:
                return Response(
                    {
                        "error": (
                            "This booking has expired. "
                            "The provider must accept and "
                            "start the job before the scheduled time."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Only approved and available providers can accept bookings.
        if new_status == "accepted":

            if (
                booking.provider.verification_status
                != ProviderProfile.APPROVED
            ):
                return Response(
                    {
                        "error": (
                            "Your provider profile is not verified. "
                            "You cannot accept bookings."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not booking.provider.available:
                return Response(
                    {"error": "You are currently unavailable."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        allowed_transitions = {
            "pending": ["accepted", "rejected"],
            "accepted": ["on_the_way"],
            "on_the_way": ["in_progress"],
            "in_progress": ["completed"],
        }

        allowed_next_states = allowed_transitions.get(
            booking.status,
            [],
        )

        # Negotiable bookings require customer approval before service starts.
        if (
            new_status == "in_progress"
            and booking.price_type == Booking.PRICE_NEGOTIABLE
            and booking.price_approval_status != "approved"
        ):
            return Response(
                {
                    "error": (
                        "The customer must approve the negotiated price "
                        "before the service can start."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status not in allowed_next_states:
            return Response(
                {
                    "error": (
                        f"Cannot change booking from "
                        f"'{booking.status}' to '{new_status}'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Record when each stage happens.
        if new_status == "accepted":
            booking.accepted_at = timezone.now()

        elif new_status == "on_the_way":
            booking.provider_on_way_at = timezone.now()

        elif new_status == "in_progress":
            booking.started_at = timezone.now()

        elif new_status == "completed":
            booking.completed_at = timezone.now()

        booking.status = new_status

        booking.save(
            update_fields=[
                "status",
                "accepted_at",
                "provider_on_way_at",
                "started_at",
                "completed_at",
                "updated_at",
            ]
        )

        # Notify the customer after a successful provider action.
        notification_details = {
            "accepted": (
                "Booking Accepted",
                f"Your booking #{booking.id} has been accepted by the provider.",
            ),
            "rejected": (
                "Booking Rejected",
                f"Your booking #{booking.id} has been rejected by the provider.",
            ),
            "on_the_way": (
                "Provider On The Way",
                f"The provider is on the way for your booking #{booking.id}.",
            ),
            "in_progress": (
                "Service Started",
                f"The provider has started your service for booking #{booking.id}.",
            ),
            "completed": (
                "Service Completed",
                f"Your service for booking #{booking.id} has been completed.",
            ),
        }

        title, message = notification_details[new_status]

        create_notification(
            recipient=booking.customer,
            title=title,
            message=message,
            notification_type=Notification.BOOKING,
            event_key=f"booking:{booking.id}:status:{new_status}:customer",
            related_booking=booking,
        )

        serializer = BookingSerializer(
            booking,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ProviderBookingLocationView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can update location."},
                status=status.HTTP_403_FORBIDDEN,
            )

        booking = Booking.objects.filter(
            id=pk,
            provider__user=request.user,
        ).first()

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )




        if booking.status not in [
        Booking.ON_THE_WAY,
         Booking.IN_PROGRESS,
       ]:
         return Response(
        {
            "error": (
                "Start the journey before sharing location."
            )
        },
        status=status.HTTP_400_BAD_REQUEST,
    )



        

        latitude = request.data.get("provider_latitude")
        longitude = request.data.get("provider_longitude")

        if latitude is None or longitude is None:
            return Response(
                {"error": "Latitude and longitude are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)

            if not (-90 <= latitude <= 90):
                raise ValueError

            if not (-180 <= longitude <= 180):
                raise ValueError

        except (TypeError, ValueError):
            return Response(
                {"error": "Invalid GPS coordinates."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.provider_latitude = latitude
        booking.provider_longitude = longitude

        booking.save(
            update_fields=[
                "provider_latitude",
                "provider_longitude",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": "Provider location updated.",
                "provider_latitude": booking.provider_latitude,
                "provider_longitude": booking.provider_longitude,
            }
        )


class CustomerBookingLocationView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        if request.user.role != "customer":
            return Response(
                {"error": "Only customers can view provider location."},
                status=status.HTTP_403_FORBIDDEN,
            )

        booking = Booking.objects.filter(
            id=pk,
            customer=request.user,
        ).first()

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.status not in [
            Booking.ON_THE_WAY,
            Booking.IN_PROGRESS,
        ]:
            return Response(
                {"error": "Provider tracking is not active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "booking_id": booking.id,
            "status": booking.status,
            "provider_latitude": booking.provider_latitude,
            "provider_longitude": booking.provider_longitude,
        })



class ProviderNegotiatedPriceView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can propose a price."},
                status=status.HTTP_403_FORBIDDEN,
            )

        booking = Booking.objects.filter(
            id=pk,
            provider__user=request.user,
        ).first()

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.price_type != Booking.PRICE_NEGOTIABLE:
            return Response(
                {"error": "This booking does not use negotiable pricing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status not in [
            Booking.ON_THE_WAY,
            Booking.IN_PROGRESS,
        ]:
            return Response(
                {"error": "A price can only be proposed after the provider is on the way."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.price_approval_status == "pending":
            return Response(
                {"error": "A price proposal is already awaiting customer approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_price = request.data.get("negotiated_price")
        description = request.data.get("negotiated_work_description", "")

        try:
            proposed_price = Decimal(str(raw_price))

            if not proposed_price.is_finite() or proposed_price <= 0:
                raise InvalidOperation

            if proposed_price.as_tuple().exponent < -2:
                raise InvalidOperation

        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"error": "Enter a valid price greater than zero, with at most two decimal places."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if proposed_price >= Decimal("100000000"):
            return Response(
                {"error": "The proposed price is too high."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        description = str(description).strip()

        if not description:
            return Response(
                {"error": "Please describe the work included in this price."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.negotiated_price = proposed_price
        booking.negotiated_work_description = description
        booking.price_approval_status = "pending"

        booking.save(
            update_fields=[
                "negotiated_price",
                "negotiated_work_description",
                "price_approval_status",
                "updated_at",
            ]
        )

        create_notification(
            recipient=booking.customer,
            title="Price Proposal Received",
            message=(
                f"Your provider has proposed Rs. {proposed_price} "
                f"for booking #{booking.id}. Please review the proposal."
            ),
            notification_type=Notification.BOOKING,
            event_key=f"booking:{booking.id}:price-proposal:{booking.updated_at.timestamp()}",
            related_booking=booking,
        )

        return Response({
            "message": "Price proposal submitted. Waiting for customer approval.",
            "booking_id": booking.id,
            "negotiated_price": str(booking.negotiated_price),
            "negotiated_work_description": booking.negotiated_work_description,
            "price_approval_status": booking.price_approval_status,
            "total_price": str(booking.total_price),
        })




class CustomerNegotiatedPriceDecisionView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        if request.user.role != "customer":
            return Response(
                {"error": "Only customers can approve or reject a price."},
                status=status.HTTP_403_FORBIDDEN,
            )

        booking = Booking.objects.filter(
            id=pk,
            customer=request.user,
        ).first()

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.price_type != Booking.PRICE_NEGOTIABLE:
            return Response(
                {"error": "This booking does not use negotiable pricing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.price_approval_status != "pending":
            return Response(
                {"error": "There is no pending price proposal to review."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.negotiated_price is None:
            return Response(
                {"error": "No proposed price was found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        decision = request.data.get("decision")

        if decision not in ["approved", "rejected"]:
            return Response(
                {"error": "Decision must be 'approved' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.price_approval_status = decision

        if decision == "approved":
            booking.total_price = booking.negotiated_price

        booking.save(
            update_fields=[
                "price_approval_status",
                "total_price",
                "updated_at",
            ]
        )

        if decision == "approved":
            title = "Price Approved"
            message = (
                f"The customer approved the negotiated price "
                f"of Rs. {booking.negotiated_price} "
                f"for booking #{booking.id}."
            )
        else:
            title = "Price Proposal Rejected"
            message = (
                f"The customer rejected the price proposal "
                f"for booking #{booking.id}. Please discuss "
                f"and submit a revised proposal."
            )

        create_notification(
            recipient=booking.provider.user,
            title=title,
            message=message,
            notification_type=Notification.BOOKING,
            event_key=(
                f"booking:{booking.id}:price-decision:"
                f"{booking.updated_at.timestamp()}"
            ),
            related_booking=booking,
        )

        return Response({
            "message": (
                "Price approved successfully."
                if decision == "approved"
                else "Price proposal rejected."
            ),
            "booking_id": booking.id,
            "price_approval_status": booking.price_approval_status,
            "total_price": str(booking.total_price),
            "negotiated_price": str(booking.negotiated_price),
        })
