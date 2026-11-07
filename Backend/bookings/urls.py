from django.urls import path

from .views import (
    BookingListCreateView,
    BookingDetailView,
    ProviderBookingListView,
    ProviderBookingActionView,
    ProviderBookingLocationView,
    CustomerBookingLocationView,
)
from .payment_views import (
    KhaltiInitiateView,
    KhaltiReturnView,
    CashPaymentConfirmView,
    ProviderTransactionHistoryView,
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

    path(
    "provider/<int:pk>/location/",
    ProviderBookingLocationView.as_view(),
    name="provider-booking-location",
),

path(
    "<int:pk>/location/",
    CustomerBookingLocationView.as_view(),
    name="customer-booking-location",
),

path("payment/khalti/initiate/", 
     KhaltiInitiateView.as_view(), 
     name="khalti-initiate"),

path("payment/khalti/return/",
      KhaltiReturnView.as_view(),
        name="khalti-return"),

path("payment/cash/confirm/",
      CashPaymentConfirmView.as_view(),
        name="cash-payment-confirm"),

        path(
    "payment/transactions/",
    ProviderTransactionHistoryView.as_view(),
    name="provider-transaction-history",
),


]
