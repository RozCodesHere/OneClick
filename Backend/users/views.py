
from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from datetime import timedelta
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from notifications.models import Notification
from notifications.services import (
    create_notification,
    notify_provider_fully_verified,
)
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from bookings.models import Booking
from providers.models import ProviderProfile, ProviderKYC

from .serializers import (
    RegisterSerializer,
    UserSerializer,
)

import secrets

from django.contrib.auth.hashers import make_password, check_password
from .models import EmailOTP

User = get_user_model()


# ============================================================
# REGISTER
# ============================================================

class RegisterView(APIView):

    permission_classes = []
    authentication_classes = []

    def post(self, request):

        email = request.data.get("email", "").strip().lower()

        existing_user = User.objects.filter(
            email__iexact=email
        ).first()

        if existing_user:

            if existing_user.is_active or existing_user.email_verified:
                return Response(
                    {"error": "This account already exists. Please log in."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            otp = str(secrets.randbelow(900000) + 100000)

            EmailOTP.objects.update_or_create(
                user=existing_user,
                defaults={
                    "otp_hash": make_password(otp),
                    "attempts": 0,
                    "expires_at": timezone.now() + timedelta(minutes=10),
                },
            )

            try:
                send_mail(
                    "OneClick Email Verification",
                    (
                        f"Your OneClick verification code is: {otp}\n\n"
                        "This code expires in 10 minutes."
                    ),
                    settings.DEFAULT_FROM_EMAIL,
                    [existing_user.email],
                    fail_silently=False,
                )

            except Exception:
                return Response(
                    {"error": "Unable to send verification email. Please try again."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            return Response(
                {
                    "message": "A new verification code has been sent.",
                    "email": existing_user.email,
                },
                status=status.HTTP_200_OK,
            )

        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save(
            is_active=False,
            email_verified=False,
        )

        otp = str(secrets.randbelow(900000) + 100000)

        EmailOTP.objects.create(
            user=user,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        try:
            send_mail(
                "OneClick Email Verification",
                (
                    f"Your OneClick verification code is: {otp}\n\n"
                    "This code expires in 10 minutes."
                ),
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

        except Exception:
            user.delete()

            return Response(
                {"error": "Unable to send verification email. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "message": "Verification code sent to your email.",
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# VERIFY EMAIL OTP
# ============================================================

class VerifyEmailOTPView(APIView):

    permission_classes = []
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        otp = request.data.get("otp", "").strip()

        if not email or not otp:
            return Response(
                {"error": "Email and verification code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()

        if not user:
            return Response(
                {"error": "Invalid email or verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            otp_record = user.email_otp
        except EmailOTP.DoesNotExist:
            return Response(
                {"error": "Verification code not found. Please register again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.now() > otp_record.expires_at:
            otp_record.delete()
            return Response(
                {"error": "Verification code expired. Please register again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_record.attempts >= 5:
            otp_record.delete()
            return Response(
                {"error": "Too many incorrect attempts. Please register again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not check_password(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            otp_record.save(update_fields=["attempts"])

            return Response(
                {"error": "Incorrect verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email_verified = True
        user.is_active = True
        user.save(update_fields=["email_verified", "is_active"])

        
        otp_record.delete()

        # Notify all active administrators.
        admin_users = User.objects.filter(
            role=User.ADMIN,
            is_active=True
        )

        for admin_user in admin_users:
            create_notification(
                recipient=admin_user,
                title="New User Registered",
                message=(
                    f"A new user has verified their email: {user.email}"
                ),
                notification_type=Notification.SYSTEM,
                priority=Notification.MEDIUM,
                event_key=f"user:{user.id}:registered:admin:{admin_user.id}",
                send_email=True,
            )

        return Response(
            {"message": "Email verified successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )



# ============================================================
# RESEND EMAIL OTP
# ============================================================

class ResendEmailOTPView(APIView):

    permission_classes = []
    authentication_classes = []

    def post(self, request):

        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"error": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()

        if not user:
            return Response(
                {"error": "Account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.email_verified:
            return Response(
                {"error": "This email is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = str(secrets.randbelow(900000) + 100000)

        EmailOTP.objects.update_or_create(
            user=user,
            defaults={
                "otp_hash": make_password(otp),
                "attempts": 0,
                "expires_at": timezone.now() + timedelta(minutes=10),
            },
        )

        try:
            send_mail(
                "OneClick Email Verification",
                (
                    f"Your OneClick verification code is: {otp}\n\n"
                    "This code expires in 10 minutes."
                ),
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

        except Exception:
            return Response(
                {"error": "Unable to send verification email."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"message": "A new verification code has been sent."},
            status=status.HTTP_200_OK,
        )

# ============================================================
# REQUEST ACCOUNT REACTIVATION
# ============================================================

class ReactivateAccountRequestView(APIView):

    permission_classes = []
    authentication_classes = []

    def post(self, request):

        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"error": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
    email__iexact=email,
    is_active=False,
).first()
        print("REACTIVATION USER FOUND:", bool(user))
        print("EMAIL VERIFIED:", user.email_verified if user else "No user")
        
        if user:
            otp = str(secrets.randbelow(900000) + 100000)

            EmailOTP.objects.update_or_create(
                user=user,
                defaults={
                    "otp_hash": make_password(otp),
                    "attempts": 0,
                    "expires_at": timezone.now() + timedelta(minutes=10),
                },
            )

            try:
                send_mail(
                    "OneClick Account Reactivation",
                    f"Your verification code is: {otp}\n\n"
                    "This code expires in 10 minutes.",
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )

            except Exception:
                return Response(
                    {"error": "Unable to send verification email."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        return Response(
            {"message": "If an eligible inactive account exists, a verification code has been sent."},
            status=status.HTTP_200_OK,
        )

# ============================================================
# VERIFY ACCOUNT REACTIVATION
# ============================================================

class ReactivateAccountVerifyView(APIView):

    permission_classes = []
    authentication_classes = []

    def post(self, request):

        email = request.data.get("email", "").strip().lower()
        otp = request.data.get("otp", "").strip()

        user = User.objects.filter(
           email__iexact=email,
is_active=False,
        ).first()

        if not user:
            return Response(
                {"error": "Invalid email or verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            otp_record = user.email_otp
        except EmailOTP.DoesNotExist:
            return Response(
                {"error": "Verification code not found. Request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.now() > otp_record.expires_at:
            otp_record.delete()
            return Response(
                {"error": "Verification code expired. Request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_record.attempts >= 5:
            otp_record.delete()
            return Response(
                {"error": "Too many attempts. Request a new code."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not check_password(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            otp_record.save(update_fields=["attempts"])

            return Response(
                {"error": "Incorrect verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = True
        user.save(update_fields=["is_active"])
        otp_record.delete()

        return Response(
            {"message": "Account reactivated successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )
# ============================================================
# LOGIN
# ============================================================

class LoginView(APIView):

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"error": "This account is inactive."},
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


# ============================================================
# GOOGLE LOGIN
# ============================================================

class GoogleLoginView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        import logging

        try:
            return self._post_google_login(request)

        except Exception:
            logging.getLogger(__name__).exception(
                "Unexpected error during Google Login"
            )

            return Response(
                {"error": "Google login failed due to a server error."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _post_google_login(self, request):
        credential = request.data.get("credential")

        if not credential:
            return Response(
                {"error": "Google credential is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")

        if not client_id or client_id.startswith("YOUR_"):
            return Response(
                {"error": "Google login is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            google_user = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                client_id,
            )
        except ValueError:
            return Response(
                {"error": "Invalid or expired Google credential."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = google_user.get("email", "").strip().lower()
        email_verified = google_user.get("email_verified", False)

        # Require a verified email from Google.
        if not email or not email_verified:
            return Response(
                {"error": "Google must verify your email address."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Allow Gmail or Google Workspace accounts.
        is_gmail = email.endswith("@gmail.com")
        hosted_domain = google_user.get("hd")

        if not is_gmail and not hosted_domain:
            return Response(
                {
                    "error": (
                        "Please use a Gmail or Google Workspace "
                        "account to sign in."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

       
        # Check whether this Google email already has an account.
        is_new_user = False

        try:
            user = User.objects.get(email__iexact=email)

        except User.DoesNotExist:
            is_new_user = True

            full_name = google_user.get("name", "").strip()
            name_parts = full_name.split(maxsplit=1)

            # New Google accounts start as customers.
            # Provider onboarding can update the role afterward.
            user = User.objects.create_user(
                email=email,
                password=None,
                first_name=name_parts[0] if name_parts else "",
                last_name=name_parts[1] if len(name_parts) > 1 else "",
                role=User.CUSTOMER,
            )

            # Notify all active administrators about the new Google account.
            admin_users = User.objects.filter(
                role=User.ADMIN,
                is_active=True
            )

            for admin_user in admin_users:
                create_notification(
                    recipient=admin_user,
                    title="New User Registered",
                    message=(
                        f"A new user registered using Google: {user.email}"
                    ),
                    notification_type=Notification.SYSTEM,
                    priority=Notification.MEDIUM,
                    event_key=(
                        f"user:{user.id}:google_registered:"
                        f"admin:{admin_user.id}"
                    ),
                    send_email=True,
                )

 

        if not user.is_active:
            return Response(
                {"error": "This account is inactive."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Google login successful.",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                },
                "is_new_user": is_new_user,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ME - GET / UPDATE PROFILE
# ============================================================

class MeView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        user = request.user

        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        email = request.data.get("email")
        profile_picture = request.FILES.get("profile_picture")
        remove_profile_picture = (
    request.data.get("remove_profile_picture") == "true"
)

        if remove_profile_picture and user.profile_picture:
          user.profile_picture.delete(save=False)
          user.profile_picture = None
        country = request.data.get("country")
        phone = request.data.get("phone")
        province = request.data.get("province")
        district = request.data.get("district")
        city = request.data.get("city")
        notification_preferences = request.data.get(
            "notification_preferences"
        )
        privacy_preferences = request.data.get(
            "privacy_preferences"
        )
        appearance_preferences = request.data.get(
            "appearance_preferences"
        )
        preferred_payment_method = request.data.get(
            "preferred_payment_method"
        )
        # Check whether the name is being changed.
        name_is_being_changed = (
            first_name is not None
            or last_name is not None
        )

        # Enforce the 24-hour name change restriction.
        if name_is_being_changed and user.name_changed_at is not None:
            now = timezone.now()

            next_allowed_change = (
                user.name_changed_at + timedelta(hours=24)
            )

            if now < next_allowed_change:
                remaining = next_allowed_change - now
                total_seconds = int(remaining.total_seconds())

                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60

                return Response(
                    {
                        "error": (
                            "You can change your name "
                            "again after 24 hours."
                        ),
                        "name_changed_at": user.name_changed_at,
                        "next_allowed_change": next_allowed_change,
                        "remaining_hours": hours,
                        "remaining_minutes": minutes,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Validate email.
        if email is not None:
            email = email.strip()

            try:
                validate_email(email)
            except ValidationError:
                return Response(
                    {"error": "Please enter a valid email address."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email_exists = (
                User.objects
                .filter(email__iexact=email)
                .exclude(pk=user.pk)
                .exists()
            )

            if email_exists:
                return Response(
                    {"error": "This email address is already in use."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        allowed_payment_methods = [
            "cash",
            "khalti",
            "esewa",
            "card",
        ]

        if (
            preferred_payment_method is not None
            and preferred_payment_method not in allowed_payment_methods
        ):
            return Response(
                {"error": "Invalid payment method."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Update supplied fields.
        if first_name is not None:
            user.first_name = first_name.strip()

        if last_name is not None:
            user.last_name = last_name.strip()

        if email is not None:
            user.email = email

        if profile_picture is not None:
            user.profile_picture = profile_picture
        if country is not None:
            user.country = country.strip()

        if province is not None:
            user.province = province.strip()

        if district is not None:
            user.district = district.strip()

        if city is not None:
            user.city = city.strip()
            
            if phone is not None:
             user.phone = phone.strip()

        if notification_preferences is not None:
            user.notification_preferences = notification_preferences

        if privacy_preferences is not None:
            user.privacy_preferences = privacy_preferences

        if appearance_preferences is not None:
            user.appearance_preferences = appearance_preferences

        if preferred_payment_method is not None:
            user.preferred_payment_method = preferred_payment_method

        if name_is_being_changed:
            user.name_changed_at = timezone.now()

        # Save only changed fields.
        update_fields = []

        if first_name is not None:
            update_fields.append("first_name")

        if last_name is not None:
            update_fields.append("last_name")

        if email is not None:
            update_fields.append("email")

        if profile_picture is not None or remove_profile_picture:
         update_fields.append("profile_picture")
        if country is not None:
            update_fields.append("country")

        if province is not None:
            update_fields.append("province")

        if district is not None:
            update_fields.append("district")

        if city is not None:
            update_fields.append("city")

            if phone is not None:
              update_fields.append("phone")
            
        if name_is_being_changed:
            update_fields.append("name_changed_at")
        if notification_preferences is not None:
            update_fields.append("notification_preferences")

        if privacy_preferences is not None:
            update_fields.append("privacy_preferences")

        if appearance_preferences is not None:
            update_fields.append("appearance_preferences")

        if preferred_payment_method is not None:
            update_fields.append("preferred_payment_method")
        if update_fields:
            user.save(update_fields=update_fields)

        serializer = UserSerializer(user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not current_password or not new_password or not confirm_password:
            return Response(
                {"error": "All password fields are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"error": "New password and confirmation do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user)
        except ValidationError as exc:
            return Response(
                {"error": exc.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


# ============================================================
# CUSTOMER DASHBOARD
# ============================================================

class CustomerDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        bookings = Booking.objects.filter(
            customer=user
        ).order_by("-created_at")

        total_bookings = bookings.count()
        completed_bookings = bookings.filter(status="completed").count()
        pending_bookings = bookings.filter(status="pending").count()
        cancelled_bookings = bookings.filter(status="cancelled").count()

        recent_bookings = bookings[:5]
        recent_data = []

        for booking in recent_bookings:
            recent_data.append(
                {
                    "id": booking.id,
                    "status": booking.status,
                    "created_at": booking.created_at,
                }
            )

        return Response(
            {
                "user": UserSerializer(user).data,
                "statistics": {
                    "total_bookings": total_bookings,
                    "completed_bookings": completed_bookings,
                    "pending_bookings": pending_bookings,
                    "cancelled_bookings": cancelled_bookings,
                },
                "recent_bookings": recent_data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN - USER LIST
# ============================================================

class AdminUserListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        users = User.objects.filter(
            role=User.CUSTOMER
        ).order_by("-date_joined")
        serializer = UserSerializer(users, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )



# ============================================================
# ADMIN - PROVIDER VERIFICATION
# ============================================================

class AdminProviderVerificationView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        if request.user.role != "admin":
            return Response(
                {"error": "Only administrators can update provider verification."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            provider = ProviderProfile.objects.get(pk=pk)

        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        verification_status = request.data.get(
            "verification_status"
        )

        allowed_statuses = [
            ProviderProfile.APPROVED,
            ProviderProfile.REJECTED,
        ]

        if verification_status not in allowed_statuses:
            return Response(
                {
                    "error": "Invalid verification status.",
                    "allowed_statuses": allowed_statuses,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remember the previous status.
        previous_status = provider.verification_status
               # A provider cannot be approved until their KYC is approved.
        if verification_status == ProviderProfile.APPROVED:

            kyc_approved = ProviderKYC.objects.filter(
                provider=provider,
                status=ProviderKYC.APPROVED,
            ).exists()

            if not kyc_approved:
                return Response(
                    {
                        "error": (
                            "Provider KYC must be approved before "
                            "approving the provider application."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # Update verification status.
        provider.verification_status = verification_status

        provider.save(
            update_fields=["verification_status"]
        )

        # Notify provider only when status actually changes.
        if previous_status != verification_status:

            if verification_status == ProviderProfile.APPROVED:

                notify_provider_fully_verified(provider)

            else:

                create_notification(
                    recipient=provider.user,
                    title="Provider Application Rejected",
                    message=(
                        "Your OneClick provider application has been rejected. "
                        "Please contact OneClick support if you need further information."
                    ),
                    notification_type=Notification.SYSTEM,
                    priority=Notification.MEDIUM,
                    event_key=(
                        f"provider:{provider.id}:verification:"
                        f"{verification_status}:user:{provider.user_id}"
                    ),
                    send_email=True,
                )
        
        return Response(
            {
                "message": "Provider verification status updated successfully.",
                "provider_id": provider.id,
                "verification_status": provider.verification_status,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN - BOOKING LIST
# ============================================================

class AdminBookingListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        bookings = (
            Booking.objects
            .select_related(
                "customer",
                "provider__user",
                "provider__category",
                "service",
                "service__category",
            )
            .all()
            .order_by("-created_at")
        )

        data = []

        for booking in bookings:
            data.append({
                "id": booking.id,

                "customer": {
                    "id": booking.customer.id,
                    "name": booking.customer.get_full_name()
                    or booking.customer.email,
                    "email": booking.customer.email,
                },

                "provider": {
                    "id": booking.provider.id,
                    "name": booking.provider.user.get_full_name()
                    or booking.provider.user.email,
                    "email": booking.provider.user.email,
                },

                "service": {
                    "id": booking.service.id,
                    "name": booking.service.name,
                    "category": booking.service.category.name,
                },

                "booking_date": booking.booking_date,
                "booking_time": booking.booking_time,

                "address": booking.address,

# Customer service location
"latitude": booking.latitude,
"longitude": booking.longitude,

# Provider live location
"provider_latitude": booking.provider_latitude,
"provider_longitude": booking.provider_longitude,

"note": booking.note,

                "total_price": booking.total_price,

"status": booking.status,
"payment_method": booking.payment_method,
"payment_status": booking.payment_status,

                "created_at": booking.created_at,
                "accepted_at": booking.accepted_at,
                "provider_on_way_at": booking.provider_on_way_at,
                "started_at": booking.started_at,
                "completed_at": booking.completed_at,
            })

        return Response(data, status=status.HTTP_200_OK)

# ============================================================
# DEACTIVATE ACCOUNT
# ============================================================

class DeactivateAccountView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        user.is_active = False
        user.save(update_fields=["is_active"])

        return Response(
            {"message": "Your account has been deactivated."},
            status=status.HTTP_200_OK,
        )


# ============================================================
# DELETE ACCOUNT
# ============================================================

class DeleteAccountView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()

        return Response(
            {"message": "Your account has been deleted."},
            status=status.HTTP_200_OK,
        )

# ============================================================
# FORGOT PASSWORD
# ============================================================

class ForgotPasswordView(APIView):

    permission_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip()

        user = User.objects.filter(
            email__iexact=email,
            is_active=True
        ).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            token = default_token_generator.make_token(user)

            reset_url = (
                f"{settings.PASSWORD_RESET_FRONTEND_URL}"
                f"/reset-password.html?uid={uid}&token={token}"
            )

            send_mail(
                "OneClick Password Reset",
                f"Open this link to reset your password:\n\n{reset_url}",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

        return Response(
            {
                "message": (
                    "If an active account exists with that email, "
                    "a password-reset link has been generated."
                )
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# RESET PASSWORD
# ============================================================

class ResetPasswordView(APIView):

    permission_classes = []

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([uid, token, new_password, confirm_password]):
            return Response(
                {"error": "All fields are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (
            ValueError,
            TypeError,
            OverflowError,
            User.DoesNotExist,
        ):
            return Response(
                {"error": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {
                    "error": "Invalid or expired reset link.",
                    "reason": "The link may be incomplete, expired, or already used."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user)
        except ValidationError as exc:
            return Response(
                {"error": exc.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {"message": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )
