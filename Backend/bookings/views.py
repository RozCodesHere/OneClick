
from rest_framework import status
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from providers.models import ProviderProfile
from services.models import ProviderService, Quotation

from .models import Booking, PaymentTransaction
from .serializers import BookingSerializer



class BookingListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

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

            # Use the accepted quotation price.
            booking_price = quotation.price

        else:
            # Preserve the existing direct-booking behaviour.
            booking_price = provider_service.price

        booking = serializer.save(
            customer=request.user,
            total_price=booking_price,
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

    def get_object(self, request, pk):
        return Booking.objects.filter(
            id=pk,
            customer=request.user,
        ).first()

    def get(self, request, pk):

        # Customers can view their own bookings.
        if request.user.role == "customer":
            booking = Booking.objects.filter(
                id=pk,
                customer=request.user,
            ).first()

        # Providers can view bookings assigned to them.
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
