from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):

        reviews = Review.objects.select_related(
            "booking",
            "booking__provider",
            "customer",
        )

        provider = request.query_params.get("provider")

        if provider:
            reviews = reviews.filter(
                booking__provider_id=provider
            )

        serializer = ReviewSerializer(reviews, many=True)

        return Response(serializer.data)

    def post(self, request):

        booking_id = request.data.get("booking")

        if not booking_id:
            return Response(
                {"booking": ["Booking ID is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking = Booking.objects.filter(
            id=booking_id,
            customer=request.user,
        ).first()

        if booking is None:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.status != Booking.COMPLETED:
            return Response(
                {"error": "You can only review completed bookings."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Review.objects.filter(booking=booking).exists():
            return Response(
                {"error": "You have already reviewed this booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewSerializer(data=request.data)

        if serializer.is_valid():
            review = serializer.save(
                customer=request.user,
                booking=booking,
                provider=booking.provider,
            )

            return Response(
                ReviewSerializer(review).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
