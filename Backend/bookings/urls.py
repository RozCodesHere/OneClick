from django.urls import path

from .views import (
    BookingListCreateView,
    BookingDetailView,
    ProviderBookingListView,
    ProviderBookingActionView,
)


urlpatterns = [

    path(
        "",
        BookingListCreateView.as_view(),
        name="booking-list-create",
    ),

    path(
        "provider/",
        ProviderBookingListView.as_view(),
        name="provider-bookings",
    ),

    path(
        "provider/<int:pk>/",
        ProviderBookingActionView.as_view(),
        name="provider-booking-action",
    ),

    path(
        "<int:pk>/",
        BookingDetailView.as_view(),
        name="booking-detail",
    ),
]