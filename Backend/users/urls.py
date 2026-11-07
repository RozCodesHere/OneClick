from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    GoogleLoginView,
    MeView,
            RegisterView,
    VerifyEmailOTPView,
    ResendEmailOTPView,
    CustomerDashboardView,
    AdminUserListView,
    AdminProviderVerificationView,
    AdminBookingListView,
    DeactivateAccountView,
    DeleteAccountView,
    ChangePasswordView,
    ForgotPasswordView,
ResetPasswordView,
ReactivateAccountRequestView,
ReactivateAccountVerifyView,
)


urlpatterns = [
    # Authentication
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "verify-email/",
        VerifyEmailOTPView.as_view(),
        name="verify-email",
    ),

        path(
        "resend-verification/",
        ResendEmailOTPView.as_view(),
        name="resend-verification",
    ),

    path(
    "reactivate/",
    ReactivateAccountRequestView.as_view(),
    name="reactivate-account",
),

path(
    "verify-reactivation/",
    ReactivateAccountVerifyView.as_view(),
    name="verify-reactivation",
),
    

    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),

    path("forgot-password/", 
         ForgotPasswordView.as_view(),  
         name="forgot-password"),

path("reset-password/", 
     ResetPasswordView.as_view(), 
       name="reset-password"),

path(
    "login/google/",
    GoogleLoginView.as_view(),
    name="google-login",
),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # Current user
    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),

path(
    "change-password/",
    ChangePasswordView.as_view(),
    name="change-password",
),
    # Customer
    path(
        "dashboard/",
        CustomerDashboardView.as_view(),
        name="customer-dashboard",
    ),

    # Admin
    path(
        "admin/users/",
        AdminUserListView.as_view(),
        name="admin-user-list",
    ),

    path(
        "admin/providers/<int:pk>/verify/",
        AdminProviderVerificationView.as_view(),
        name="admin-provider-verification",
    ),

    path(
        "admin/bookings/",
        AdminBookingListView.as_view(),
        name="admin-booking-list",
    ),

    # Account management
    path(
        "deactivate/",
        DeactivateAccountView.as_view(),
        name="deactivate-account",
    ),

    path(
        "delete/",
        DeleteAccountView.as_view(),
        name="delete-account",
    ),
    
]
