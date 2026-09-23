from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from bookings.models import Booking
from providers.models import ProviderProfile

from .serializers import (
    RegisterSerializer,
    UserSerializer,
)


User = get_user_model()


# =========================================================
# REGISTER
# =========================================================

class RegisterView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(
            data=request.data
        )

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

        user = User.objects.filter(
            email=email
        ).first()

        if user is None or not user.check_password(password):

            return Response(
                {
                    "error": "Invalid email or password."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # -------------------------------------------------
        # CHECK IF ACCOUNT IS DEACTIVATED
        # -------------------------------------------------

        if not user.is_active:

            return Response(
                {
                    "error": "Your account is deactivated."
                },
                status=status.HTTP_403_FORBIDDEN,
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

    # -----------------------------------------------------
    # GET CURRENT USER
    # -----------------------------------------------------

    def get(self, request):

        serializer = UserSerializer(
            request.user
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # -----------------------------------------------------
    # UPDATE CURRENT USER
    # -----------------------------------------------------

    def patch(self, request):

        user = request.user

        first_name = request.data.get(
            "first_name"
        )

        last_name = request.data.get(
            "last_name"
        )

        # ---------------------------------------------
        # CHECK IF NAME IS BEING CHANGED
        # ---------------------------------------------

        name_is_being_changed = (
            first_name is not None
            or last_name is not None
        )

        # ---------------------------------------------
        # 24-HOUR NAME CHANGE RESTRICTION
        # ---------------------------------------------

        if name_is_being_changed:

            if user.name_changed_at is not None:

                from django.utils import timezone
                from datetime import timedelta

                now = timezone.now()

                next_allowed_change = (
                    user.name_changed_at
                    + timedelta(hours=24)
                )

                if now < next_allowed_change:

                    remaining = (
                        next_allowed_change - now
                    )

                    total_seconds = int(
                        remaining.total_seconds()
                    )

                    hours = total_seconds // 3600

                    minutes = (
                        total_seconds % 3600
                    ) // 60

                    return Response(
                        {
                            "error": (
                                "You can change your "
                                "name again after 24 hours."
                            ),
                            "name_changed_at":
                                user.name_changed_at,
                            "next_allowed_change":
                                next_allowed_change,
                            "remaining_hours":
                                hours,
                            "remaining_minutes":
                                minutes,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # ---------------------------------------------
        # UPDATE FIRST NAME
        # ---------------------------------------------

        if first_name is not None:

            user.first_name = first_name.strip()

        # ---------------------------------------------
        # UPDATE LAST NAME
        # ---------------------------------------------

        if last_name is not None:

            user.last_name = last_name.strip()

        # ---------------------------------------------
        # RECORD NAME CHANGE TIME
        # ---------------------------------------------

        if name_is_being_changed:

            from django.utils import timezone

            user.name_changed_at = timezone.now()

        # ---------------------------------------------
        # SAVE USER
        # ---------------------------------------------

        update_fields = []

        if first_name is not None:
            update_fields.append("first_name")

        if last_name is not None:
            update_fields.append("last_name")

        if name_is_being_changed:
            update_fields.append("name_changed_at")

        user.save(
            update_fields=update_fields
        )

        # ---------------------------------------------
        # RETURN UPDATED USER
        # ---------------------------------------------

        serializer = UserSerializer(
            user
        )

        return Response(
            serializer.data,
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
                    "error": (
                        "Only customers can "
                        "access this dashboard."
                    )
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

                    "total_bookings":
                        bookings.count(),

                    "pending_bookings":
                        bookings.filter(
                            status="pending"
                        ).count(),

                    "accepted_bookings":
                        bookings.filter(
                            status="accepted"
                        ).count(),

                    "completed_bookings":
                        bookings.filter(
                            status="completed"
                        ).count(),

                    "cancelled_bookings":
                        bookings.filter(
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
                    "error": (
                        "Only admins can "
                        "access this endpoint."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        users = User.objects.all().order_by(
            "-date_joined"
        )

        return Response(
            [
                {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "is_active": user.is_active,
                    "date_joined": user.date_joined,
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
                    "error": (
                        "Only admins can "
                        "verify providers."
                    )
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

        verified = request.data.get(
            "verified"
        )

        if not isinstance(
            verified,
            bool
        ):

            return Response(
                {
                    "error": (
                        "Verified must be "
                        "true or false."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider.verified = verified

        provider.save(
            update_fields=[
                "verified"
            ]
        )

        return Response(
            {
                "message": (
                    "Provider verification "
                    "updated successfully."
                ),

                "provider_id":
                    provider.id,

                "verified":
                    provider.verified,
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
                    "error": (
                        "Only admins can "
                        "access this endpoint."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        bookings = Booking.objects.select_related(
            "customer",
            "provider__user",
            "service",
        ).order_by(
            "-created_at"
        )

        return Response(
            [
                {
                    "id": booking.id,

                    "customer": {
                        "id":
                            booking.customer.id,

                        "name": (
                            f"{booking.customer.first_name} "
                            f"{booking.customer.last_name}"
                        ).strip(),

                        "email":
                            booking.customer.email,
                    },

                    "provider": {
                        "id":
                            booking.provider.id,

                        "name": (
                            f"{booking.provider.user.first_name} "
                            f"{booking.provider.user.last_name}"
                        ).strip(),
                    },

                    "service":
                        booking.service.name,

                    "booking_date":
                        booking.booking_date,

                    "booking_time":
                        booking.booking_time,

                    "address":
                        booking.address,

                    "note":
                        booking.note,

                    "status":
                        booking.status,

                    "total_price":
                        str(
                            booking.total_price
                        ),

                    "created_at":
                        booking.created_at,
                }

                for booking in bookings
            ]
        )

class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        user.is_active = False
        user.save(update_fields=["is_active"])

        return Response(
            {
                "message": "Your account has been deactivated."
            },
            status=status.HTTP_200_OK,
        )


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        email = user.email

        user.delete()

        return Response(
            {
                "message": f"Account {email} has been permanently deleted."
            },
            status=status.HTTP_200_OK,
        )