from django.urls import path

from .views import (
    ServiceCategoryListView,
    ServiceDetailView,
    ServiceListView,
    ServiceRequestListCreateView,
    ProviderServiceRequestListView,
    QuotationListCreateView,
    QuotationAcceptView,
    QuotationRejectView,
    QuotationCounterOfferView,
    QuotationFinalOfferView,
    ProviderServiceListCreateView,
ProviderServiceDetailView,
)


urlpatterns = [

    # =====================================================
    # SERVICE CATEGORIES
    # =====================================================

    path(
        "categories/",
        ServiceCategoryListView.as_view(),
        name="service-category-list",
    ),


    # =====================================================
    # SERVICES
    # =====================================================

    path(
        "",
        ServiceListView.as_view(),
        name="service-list",
    ),

path(
    "provider/",
    ProviderServiceListCreateView.as_view(),
    name="provider-service-list-create",
),

path(
    "provider/<int:pk>/",
    ProviderServiceDetailView.as_view(),
    name="provider-service-detail",
),

    path(
        "<int:pk>/",
        ServiceDetailView.as_view(),
        name="service-detail",
    ),


    # =====================================================
    # SERVICE REQUESTS
    # =====================================================

    path(
        "requests/",
        ServiceRequestListCreateView.as_view(),
        name="service-request-list-create",
    ),

    path(
        "requests/provider/",
        ProviderServiceRequestListView.as_view(),
        name="provider-service-requests",
    ),


    # =====================================================
    # QUOTATIONS
    # =====================================================

    path(
        "quotations/",
        QuotationListCreateView.as_view(),
        name="quotation-list-create",
    ),

    path(
        "quotations/<int:pk>/accept/",
        QuotationAcceptView.as_view(),
        name="quotation-accept",
    ),

    path(
        "quotations/<int:pk>/reject/",
        QuotationRejectView.as_view(),
        name="quotation-reject",
    ),

    path(
    "quotations/<int:pk>/counter/",
    QuotationCounterOfferView.as_view(),
    name="quotation-counter",
),

path(
    "quotations/<int:pk>/final/",
    QuotationFinalOfferView.as_view(),
    name="quotation-final",
),
]

