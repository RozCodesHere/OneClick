from django.urls import path


from .views import (
    NearbyProviderListView,
    ProviderListView,
    ProviderDetailView,
    ProviderDashboardView,
    ProviderAvailabilityView,
    ProviderOnboardingView,
    ProviderLocationUpdateView,
    ProviderWorkPhotoUploadView,
    SavedProviderListCreateView,
    SavedProviderDeleteView,
    AdminProviderListView,
    ProviderWorkPhotoDeleteView,
    ProviderKYCUploadView,
    ProviderKYCStatusView,
    ProviderKYCDocumentView,
    AdminProviderKYCReviewView,
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
    
    path("nearby/", NearbyProviderListView.as_view(), name="nearby-providers"),
  
    path(
        "<int:pk>/",
        ProviderDetailView.as_view(),
        name="provider-detail",
    ),

    path(
    "location/",
    ProviderLocationUpdateView.as_view(),
    name="provider-location-update",
),

    path(
        "work-photos/upload/",
        ProviderWorkPhotoUploadView.as_view(),
        name="provider-work-photo-upload",
    ),

    path(
    "work-photos/<int:photo_id>/delete/",
    ProviderWorkPhotoDeleteView.as_view(),
    name="provider-work-photo-delete",
),



    # =====================================================
    # PROVIDER KYC
    # =====================================================

    path(
        "kyc/upload/",
        ProviderKYCUploadView.as_view(),
        name="provider-kyc-upload",
    ),

    path(
        "kyc/status/",
        ProviderKYCStatusView.as_view(),
        name="provider-kyc-status",
    ),

    path(
    "kyc/documents/<int:provider_id>/<str:document_type>/",
    ProviderKYCDocumentView.as_view(),
    name="provider-kyc-document",
),

path(
    "admin/kyc/",
    AdminProviderKYCReviewView.as_view(),
    name="admin-provider-kyc-list",
),

path(
    "admin/kyc/<int:kyc_id>/",
    AdminProviderKYCReviewView.as_view(),
    name="admin-provider-kyc-review",
),
]
