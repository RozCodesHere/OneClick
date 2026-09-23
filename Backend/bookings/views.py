from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking
from .serializers import BookingSerializer
from services.models import ProviderService


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

        serializer = BookingSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider = serializer.validated_data["provider"]
        service = serializer.validated_data["service"]

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

        booking = serializer.save(
            customer=request.user,
            total_price=provider_service.price,
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
            customer=request.user
        ).first()

    def get(self, request, pk):

        booking = self.get_object(
            request,
            pk
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

        booking = self.get_object(
            request,
            pk
        )

        if booking is None:

            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.data.get("status") != "cancelled":

            return Response(
                {
                    "error": "You can only cancel a booking."
                },
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
            provider__user=request.user
        ).first()

        if booking is None:

            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")

        allowed_transitions = {
            "pending": [
                "accepted",
                "rejected",
            ],
            "accepted": [
                "completed",
            ],
        }

        allowed_next_states = allowed_transitions.get(
            booking.status,
            []
        )

        if new_status not in allowed_next_states:

            return Response(
                {
                    "error": (
                        f"Cannot change booking from "
                        f"'{booking.status}' to "
                        f"'{new_status}'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = new_status

        booking.save(
            update_fields=[
                "status",
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