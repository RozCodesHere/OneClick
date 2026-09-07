from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from bookings.models import Booking
from providers.models import ProviderProfile

from .serializers import RegisterSerializer


User = get_user_model()


# =========================================================
# REGISTER
# =========================================================

class RegisterView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.save()

            return Response(
                {
                    "message": "User registered successfully.",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "role": user.role,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


# =========================================================
# LOGIN
# =========================================================

class LoginView(APIView):

    def post(self, request):

        email = request.data.get("email")
        password = request.data.get("password")

        user = User.objects.filter(email=email).first()

        if user is None or not user.check_password(password):

            return Response(
                {
                    "error": "Invalid email or password."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful.",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# CURRENT USER / ME
# =========================================================

class MeView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        return Response(
            {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# CUSTOMER DASHBOARD
# =========================================================

class CustomerDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "customer":

            return Response(
                {
                    "error": "Only customers can access this dashboard."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        bookings = Booking.objects.filter(
            customer=request.user
        )

        return Response(
            {
                "customer": {
                    "id": request.user.id,
                    "email": request.user.email,
                    "first_name": request.user.first_name,
                    "last_name": request.user.last_name,
                },

                "statistics": {
                    "total_bookings": bookings.count(),

                    "pending_bookings": bookings.filter(
                        status="pending"
                    ).count(),

                    "accepted_bookings": bookings.filter(
                        status="accepted"
                    ).count(),

                    "completed_bookings": bookings.filter(
                        status="completed"
                    ).count(),

                    "cancelled_bookings": bookings.filter(
                        status="cancelled"
                    ).count(),
                },
            }
        )


# =========================================================
# ADMIN - LIST ALL USERS
# =========================================================

class AdminUserListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "admin":

            return Response(
                {
                    "error": "Only admins can access this endpoint."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        users = User.objects.all().order_by("-date_joined")

        return Response(
            [
                {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "is_active": user.is_active,
                }
                for user in users
            ]
        )


# =========================================================
# ADMIN - VERIFY / UNVERIFY PROVIDER
# =========================================================

class AdminProviderVerificationView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        if request.user.role != "admin":

            return Response(
                {
                    "error": "Only admins can verify providers."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:

            provider = ProviderProfile.objects.get(
                pk=pk
            )

        except ProviderProfile.DoesNotExist:

            return Response(
                {
                    "error": "Provider not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        verified = request.data.get("verified")

        if not isinstance(verified, bool):

            return Response(
                {
                    "error": "Verified must be true or false."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider.verified = verified

        provider.save(
            update_fields=["verified"]
        )

        return Response(
            {
                "message": "Provider verification updated successfully.",
                "provider_id": provider.id,
                "verified": provider.verified,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# ADMIN - LIST ALL BOOKINGS
# =========================================================

class AdminBookingListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "admin":

            return Response(
                {
                    "error": "Only admins can access this endpoint."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        bookings = Booking.objects.select_related(
            "customer",
            "provider__user",
            "service",
        ).order_by("-created_at")

        return Response(
            [
                {
                    "id": booking.id,

                    "customer": {
                        "id": booking.customer.id,
                        "name": (
                            f"{booking.customer.first_name} "
                            f"{booking.customer.last_name}"
                        ).strip(),
                        "email": booking.customer.email,
                    },

                    "provider": {
                        "id": booking.provider.id,
                        "name": (
                            f"{booking.provider.user.first_name} "
                            f"{booking.provider.user.last_name}"
                        ).strip(),
                    },

                    "service": booking.service.name,

                    "booking_date": booking.booking_date,

                    "booking_time": booking.booking_time,

                    "address": booking.address,

                    "note": booking.note,

                    "status": booking.status,

                    "total_price": str(
                        booking.total_price
                    ),

                    "created_at": booking.created_at,
                }

                for booking in bookings
            ]
        )