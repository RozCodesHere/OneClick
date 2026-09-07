from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    RegisterView,
    CustomerDashboardView,
    AdminUserListView,
    AdminProviderVerificationView,
    AdminBookingListView,
)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path(
        "dashboard/",
        CustomerDashboardView.as_view(),
        name="customer-dashboard",
    ),

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
]