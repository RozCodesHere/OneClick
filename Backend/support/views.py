from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import (
    SupportTicket,
    ContactMessage,
)

from .serializers import (
    SupportTicketSerializer,
    AdminSupportTicketSerializer,
    ContactMessageSerializer,
)


# =========================================================
# USER SUPPORT TICKETS
# =========================================================

class SupportTicketListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = SupportTicketSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return SupportTicket.objects.filter(
            user=self.request.user
        ).order_by(
            "-created_at"
        )

    def perform_create(
        self,
        serializer
    ):

        serializer.save(
            user=self.request.user
        )


# =========================================================
# ADMIN — ALL SUPPORT TICKETS
# =========================================================

class AdminSupportTicketListView(
    generics.ListAPIView
):

    serializer_class = AdminSupportTicketSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        if not self.request.user.is_staff:

            return SupportTicket.objects.none()

        return SupportTicket.objects.all().order_by(
            "-created_at"
        )


# =========================================================
# ADMIN — VIEW / UPDATE SINGLE TICKET
# =========================================================

class AdminSupportTicketDetailView(
    generics.RetrieveUpdateAPIView
):

    serializer_class = AdminSupportTicketSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        if not self.request.user.is_staff:

            return SupportTicket.objects.none()

        return SupportTicket.objects.all()


# =========================================================
# PUBLIC CONTACT MESSAGE
# =========================================================

class ContactMessageCreateView(
    generics.CreateAPIView
):

    queryset = ContactMessage.objects.all()

    serializer_class = ContactMessageSerializer

    # Contact Us is publicly accessible.
    # Login is NOT required.

    permission_classes = []