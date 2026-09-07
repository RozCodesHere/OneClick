from django.db.models import Q

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from .models import ProviderProfile
from .serializers import ProviderSerializer


class ProviderListView(generics.ListAPIView):
    serializer_class = ProviderSerializer

    def get_queryset(self):
        queryset = ProviderProfile.objects.select_related(
            "user",
            "category"
        ).filter(
            available=True,
            verified=True,
        )

        search = self.request.query_params.get("search")
        category = self.request.query_params.get("category")
        city = self.request.query_params.get("city")

        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(bio__icontains=search)
                | Q(category__name__icontains=search)
            )

        if category:
            queryset = queryset.filter(category_id=category)

        if city:
            queryset = queryset.filter(
                address__icontains=city
            )

        return queryset


class ProviderDetailView(generics.RetrieveAPIView):
    queryset = ProviderProfile.objects.select_related(
        "user",
        "category"
    ).filter(
        available=True,
        verified=True,
    )

    serializer_class = ProviderSerializer


class ProviderDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "provider":
            return Response(
                {
                    "error": "Only providers can access this dashboard."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = ProviderProfile.objects.select_related(
                "user",
                "category"
            ).get(
                user=request.user
            )

        except ProviderProfile.DoesNotExist:
            return Response(
                {
                    "error": "Provider profile not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        bookings = Booking.objects.filter(
            provider=profile
        )

        return Response(
            {
                "provider": {
                    "id": profile.id,
                    "name": f"{profile.user.first_name} {profile.user.last_name}".strip(),
                    "email": profile.user.email,
                    "category": profile.category.name,
                    "experience": profile.experience,
                    "address": profile.address,
                    "hourly_rate": str(profile.hourly_rate),
                    "available": profile.available,
                    "verified": profile.verified,
                },

                "statistics": {
                    "total_bookings": bookings.count(),
                    "pending_bookings": bookings.filter(
                        status="pending"
                    ).count(),
                    "accepted_bookings": bookings.filter(
                        status="accepted"
                    ).count(),
                    "completed_bookings": bookings.filter(
                        status="completed"
                    ).count(),
                    "cancelled_bookings": bookings.filter(
                        status="cancelled"
                    ).count(),
                },
            }
        )


class ProviderAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):

        if request.user.role != "provider":
            return Response(
                {
                    "error": "Only providers can change availability."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = ProviderProfile.objects.get(
                user=request.user
            )

        except ProviderProfile.DoesNotExist:
            return Response(
                {
                    "error": "Provider profile not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        available = request.data.get("available")

        if not isinstance(available, bool):
            return Response(
                {
                    "error": "Available must be true or false."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.available = available

        profile.save(
            update_fields=["available"]
        )

        return Response(
            {
                "message": "Availability updated successfully.",
                "available": profile.available,
            },
            status=status.HTTP_200_OK,
        )