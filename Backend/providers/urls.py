from django.urls import path

from .views import (
    ProviderListView,
    ProviderDetailView,
    ProviderDashboardView,
    ProviderAvailabilityView,
)

urlpatterns = [
    path(
        "dashboard/",
        ProviderDashboardView.as_view(),
        name="provider-dashboard",
    ),

    path(
        "availability/",
        ProviderAvailabilityView.as_view(),
        name="provider-availability",
    ),

    path(
        "",
        ProviderListView.as_view(),
        name="provider-list",
    ),

    path(
        "<int:pk>/",
        ProviderDetailView.as_view(),
        name="provider-detail",
    ),
]