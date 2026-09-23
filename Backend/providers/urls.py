from django.urls import path

from .views import (
    ProviderListView,
    ProviderDetailView,
    ProviderDashboardView,
    ProviderAvailabilityView,
    ProviderOnboardingView,
    SavedProviderListCreateView,
    SavedProviderDeleteView,
    AdminProviderListView,
)


urlpatterns = [

    # =====================================================
    # PROVIDER DASHBOARD
    # =====================================================

    path(
        "dashboard/",
        ProviderDashboardView.as_view(),
        name="provider-dashboard",
    ),

    # =====================================================
    # PROVIDER AVAILABILITY
    # =====================================================

    path(
        "availability/",
        ProviderAvailabilityView.as_view(),
        name="provider-availability",
    ),

    # =====================================================
    # SAVED PROVIDERS
    # =====================================================

    path(
        "saved-providers/",
        SavedProviderListCreateView.as_view(),
        name="saved-provider-list-create",
    ),

    path(
        "saved-providers/<int:provider_id>/",
        SavedProviderDeleteView.as_view(),
        name="saved-provider-delete",
    ),

    # =====================================================
    # PROVIDER ONBOARDING
    # =====================================================

    path(
        "onboard/",
        ProviderOnboardingView.as_view(),
        name="provider-onboard",
    ),

    # =====================================================
    # ADMIN — ALL PROVIDERS
    # =====================================================

    path(
        "admin/",
        AdminProviderListView.as_view(),
        name="admin-provider-list",
    ),

    # =====================================================
    # PROVIDERS
    # =====================================================

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