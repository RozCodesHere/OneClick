from django.db.models import Q

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking

from .models import ProviderProfile, SavedProvider
from .serializers import (
    ProviderSerializer,
    SavedProviderSerializer,
    ProviderOnboardingSerializer,
)


# =========================================================
# PROVIDER ONBOARDING
# =========================================================

class ProviderOnboardingView(generics.CreateAPIView):

    serializer_class = ProviderOnboardingSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):

        if request.user.role != "customer":
            return Response(
                {
                    "error": "Only customers can become providers."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request
            }
        )

        serializer.is_valid(
            raise_exception=True
        )

        provider = serializer.save()

        response_serializer = ProviderSerializer(
            provider,
            context={
                "request": request
            }
        )

        return Response(
            {
                "message": (
                    "Provider application submitted successfully. "
                    "Your profile is waiting for admin verification."
                ),
                "provider": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# PROVIDER LIST
# =========================================================

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

        # -------------------------------------------------
        # SEARCH
        # -------------------------------------------------

        search = self.request.query_params.get(
            "search"
        )

        if search:

            queryset = queryset.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(bio__icontains=search)
                | Q(category__name__icontains=search)
            )

        # -------------------------------------------------
        # CATEGORY FILTER
        # -------------------------------------------------

        category = self.request.query_params.get(
            "category"
        )

        if category:

            queryset = queryset.filter(
                category_id=category
            )

        # -------------------------------------------------
        # CITY FILTER
        # -------------------------------------------------

        city = self.request.query_params.get(
            "city"
        )

        if city:

            queryset = queryset.filter(
                address__icontains=city
            )

        # -------------------------------------------------
        # SERVICE FILTER
        #
        # Only return providers who actually offer the
        # selected service through ProviderService.
        # -------------------------------------------------

        service_id = self.request.query_params.get(
            "service_id"
        )

        if service_id:

            queryset = queryset.filter(
                provider_services__service_id=service_id,
                provider_services__is_active=True,
            ).distinct()

        return queryset

    # -----------------------------------------------------
    # SERIALIZER CONTEXT
    # -----------------------------------------------------

    def get_serializer_context(self):

        context = super().get_serializer_context()

        service_id = self.request.query_params.get(
            "service_id"
        )

        if service_id:

            try:

                context["service_id"] = int(
                    service_id
                )

            except (TypeError, ValueError):

                context["service_id"] = None

        return context


# =========================================================
# PROVIDER DETAIL
# =========================================================

class ProviderDetailView(
    generics.RetrieveAPIView
):

    queryset = ProviderProfile.objects.select_related(
        "user",
        "category"
    ).filter(
        available=True,
        verified=True,
    )

    serializer_class = ProviderSerializer

    def get_serializer_context(self):

        context = super().get_serializer_context()

        service_id = self.request.query_params.get(
            "service_id"
        )

        if service_id:

            try:

                context["service_id"] = int(
                    service_id
                )

            except (TypeError, ValueError):

                context["service_id"] = None

        return context


# =========================================================
# PROVIDER DASHBOARD
# =========================================================

class ProviderDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "provider":

            return Response(
                {
                    "error": (
                        "Only providers can access "
                        "this dashboard."
                    )
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

        serializer = ProviderSerializer(
            profile,
            context={
                "request": request
            }
        )

        return Response(
            {
                "provider": serializer.data,

                "statistics": {

                    "total_bookings":
                        bookings.count(),

                    "pending_bookings":
                        bookings.filter(
                            status="pending"
                        ).count(),

                    "accepted_bookings":
                        bookings.filter(
                            status="accepted"
                        ).count(),

                    "completed_bookings":
                        bookings.filter(
                            status="completed"
                        ).count(),

                    "cancelled_bookings":
                        bookings.filter(
                            status="cancelled"
                        ).count(),
                },
            }
        )


# =========================================================
# PROVIDER AVAILABILITY
# =========================================================

class ProviderAvailabilityView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request):

        if request.user.role != "provider":

            return Response(
                {
                    "error": (
                        "Only providers can change "
                        "availability."
                    )
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

        available = request.data.get(
            "available"
        )

        if not isinstance(
            available,
            bool
        ):

            return Response(
                {
                    "error": (
                        "Available must be "
                        "true or false."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.available = available

        profile.save(
            update_fields=[
                "available"
            ]
        )

        return Response(
            {
                "message":
                    "Availability updated successfully.",

                "available":
                    profile.available,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# ADMIN PROVIDER LIST
# =========================================================

class AdminProviderListView(
    generics.ListAPIView
):

    serializer_class = ProviderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if self.request.user.role != "admin":

            return ProviderProfile.objects.none()

        return ProviderProfile.objects.select_related(
            "user",
            "category"
        ).all().order_by(
            "-id"
        )

    def list(self, request, *args, **kwargs):

        if request.user.role != "admin":

            return Response(
                {
                    "error": (
                        "Only administrators can "
                        "access providers."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().list(
            request,
            *args,
            **kwargs
        )


# =========================================================
# SAVED PROVIDERS
# =========================================================

class SavedProviderListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    # -----------------------------------------------------
    # GET SAVED PROVIDERS
    # -----------------------------------------------------

    def get(self, request):

        if request.user.role != "customer":

            return Response(
                {
                    "error": (
                        "Only customers can access "
                        "saved providers."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        saved_providers = (
            SavedProvider.objects
            .filter(
                customer=request.user
            )
            .select_related(
                "provider",
                "provider__user",
                "provider__category",
            )
            .order_by(
                "-created_at"
            )
        )

        serializer = SavedProviderSerializer(
            saved_providers,
            many=True,
            context={
                "request": request
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # -----------------------------------------------------
    # SAVE PROVIDER
    # -----------------------------------------------------

    def post(self, request):

        if request.user.role != "customer":

            return Response(
                {
                    "error": (
                        "Only customers can save "
                        "providers."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        provider_id = request.data.get(
            "provider"
        )

        if not provider_id:

            return Response(
                {
                    "error": "provider is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            provider = ProviderProfile.objects.get(
                id=provider_id
            )

        except ProviderProfile.DoesNotExist:

            return Response(
                {
                    "error": "Provider not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_provider, created = (
            SavedProvider.objects.get_or_create(
                customer=request.user,
                provider=provider,
            )
        )

        serializer = SavedProviderSerializer(
            saved_provider,
            context={
                "request": request
            },
        )

        if created:

            return Response(
                {
                    "message":
                        "Provider saved successfully.",

                    "saved":
                        True,

                    "data":
                        serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "message":
                    "Provider is already saved.",

                "saved":
                    True,

                "data":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# REMOVE SAVED PROVIDER
# =========================================================

class SavedProviderDeleteView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(
        self,
        request,
        provider_id
    ):

        if request.user.role != "customer":

            return Response(
                {
                    "error": (
                        "Only customers can remove "
                        "saved providers."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:

            saved_provider = (
                SavedProvider.objects.get(
                    customer=request.user,
                    provider_id=provider_id,
                )
            )

        except SavedProvider.DoesNotExist:

            return Response(
                {
                    "error": (
                        "Provider is not in "
                        "your saved list."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_provider.delete()

        return Response(
            {
                "message":
                    "Provider removed successfully.",

                "saved":
                    False,
            },
            status=status.HTTP_200_OK,
        )