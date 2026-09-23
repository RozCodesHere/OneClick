from django.urls import path

from .views import (
    SupportTicketListCreateView,
    AdminSupportTicketListView,
    AdminSupportTicketDetailView,
    ContactMessageCreateView,
)


urlpatterns = [

    # =====================================================
    # USER SUPPORT TICKETS
    # =====================================================

    path(
        "tickets/",
        SupportTicketListCreateView.as_view(),
        name="support-tickets",
    ),

    # =====================================================
    # ADMIN — ALL SUPPORT TICKETS
    # =====================================================

    path(
        "admin/tickets/",
        AdminSupportTicketListView.as_view(),
        name="admin-support-tickets",
    ),

    # =====================================================
    # ADMIN — SINGLE SUPPORT TICKET
    # =====================================================

    path(
        "admin/tickets/<int:pk>/",
        AdminSupportTicketDetailView.as_view(),
        name="admin-support-ticket-detail",
    ),

    # =====================================================
    # PUBLIC CONTACT MESSAGE
    # =====================================================

    path(
        "contact/",
        ContactMessageCreateView.as_view(),
        name="contact-message",
    ),
]