
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


# =========================================================
# LIST NOTIFICATIONS
# =========================================================

class NotificationListView(generics.ListAPIView):

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by("-created_at")


# =========================================================
# UNREAD NOTIFICATION COUNT
# =========================================================

class NotificationUnreadCountView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).count()

        return Response({
            "unread_count": unread_count
        })


# =========================================================
# MARK ONE NOTIFICATION AS READ
# =========================================================

class NotificationMarkReadView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        try:
            notification = Notification.objects.get(
                id=pk,
                recipient=request.user,
            )

        except Notification.DoesNotExist:

            return Response(
                {"error": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not notification.is_read:

            notification.is_read = True
            notification.read_at = timezone.now()

            notification.save(
                update_fields=["is_read", "read_at"]
            )

        return Response({
            "message": "Notification marked as read.",
            "id": notification.id,
            "is_read": notification.is_read,
        })


# =========================================================
# MARK ALL NOTIFICATIONS AS READ
# =========================================================

class NotificationMarkAllReadView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        updated_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).update(
            is_read=True,
            read_at=timezone.now(),
        )

        return Response({
            "message": "All notifications marked as read.",
            "updated_count": updated_count,
        })
