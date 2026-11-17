from math import radians, sin, cos, asin, sqrt
import mimetypes

from django.http import FileResponse
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.files.images import get_image_dimensions
from django.contrib.auth import get_user_model

from notifications.models import Notification
from notifications.services import create_notification

User = get_user_model()
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from bookings.models import Booking

from .models import (
    ProviderProfile,
    SavedProvider,
    ProviderWorkPhoto,
    ProviderKYC,
)# =========================================================
# PROVIDER WORK PHOTO UPLOAD
# =========================================================

class ProviderWorkPhotoUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can upload work photos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        image = request.FILES.get("image")

        if not image:
            return Response(
                {"error": "Please select an image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        photo = ProviderWorkPhoto.objects.create(
            provider=profile,
            image=image,
            caption=request.data.get("caption", ""),
        )

        from .serializers import ProviderWorkPhotoSerializer

        serializer = ProviderWorkPhotoSerializer(
            photo,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )
from .serializers import (
    ProviderSerializer,
    SavedProviderSerializer,
    ProviderOnboardingSerializer,
)

# =========================================================
# PROVIDER WORK PHOTO DELETE
# =========================================================

class ProviderWorkPhotoDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, photo_id):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can delete work photos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            photo = ProviderWorkPhoto.objects.get(
                id=photo_id,
                provider__user=request.user,
            )
        except ProviderWorkPhoto.DoesNotExist:
            return Response(
                {"error": "Work photo not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        photo.delete()

        return Response(
            {"message": "Work photo deleted successfully."},
            status=status.HTTP_200_OK,
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
                {"error": "Only customers can become providers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        provider = serializer.save()

        # Notify all active administrators.
        admin_users = User.objects.filter(
            role=User.ADMIN,
            is_active=True
        )

        for admin_user in admin_users:
            create_notification(
                recipient=admin_user,
                title="New Provider Application",
                message=(
                    f"{request.user.email} has submitted a provider application "
                    f"(Provider ID: {provider.id})."
                ),
                notification_type=Notification.SYSTEM,
                priority=Notification.MEDIUM,
                event_key=f"provider:{provider.id}:application:admin:{admin_user.id}",
                send_email=True,
            )

        response_serializer = ProviderSerializer(
            provider,
            context={"request": request},
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
# NEARBY PROVIDERS
# =========================================================

class NearbyProviderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Validate customer coordinates and search radius.
        try:
            latitude = float(request.query_params.get("latitude"))
            longitude = float(request.query_params.get("longitude"))
            radius = float(request.query_params.get("radius", 10))
        except (TypeError, ValueError):
            return Response(
                {
                    "error": (
                        "Valid latitude and longitude are required. "
                        "Radius must be a number."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (-90 <= latitude <= 90):
            return Response(
                {"error": "Latitude must be between -90 and 90."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (-180 <= longitude <= 180):
            return Response(
                {"error": "Longitude must be between -180 and 180."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (0 < radius <= 100):
            return Response(
                {
                    "error": (
                        "Radius must be greater than 0 "
                        "and at most 100 km."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Rough geographic boundaries for database filtering.
        latitude_range = radius / 111.0
        longitude_range = radius / (
            111.0 * max(abs(cos(radians(latitude))), 0.01)
        )

        providers = ProviderProfile.objects.select_related(
            "user",
            "category",
                ).filter(
            verification_status=ProviderProfile.APPROVED,
             kyc__status=ProviderKYC.APPROVED,
            availability_status="available",
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=max(-90, latitude - latitude_range),
            latitude__lte=min(90, latitude + latitude_range),
            longitude__gte=max(-180, longitude - longitude_range),
            longitude__lte=min(180, longitude + longitude_range),
        )

        # Optional service filter.
        service_id = request.query_params.get("service_id")

        if service_id:
            try:
                service_id = int(service_id)
                if service_id <= 0:
                    raise ValueError
            except (TypeError, ValueError):
                return Response(
                    {"error": "service_id must be a positive integer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            providers = providers.filter(
                provider_services__service_id=service_id,
                provider_services__is_active=True,
            ).distinct()

        results = []

        # Calculate exact distance for each candidate provider.
        for provider in providers:
            provider_latitude = float(provider.latitude)
            provider_longitude = float(provider.longitude)

            lat1 = radians(latitude)
            lat2 = radians(provider_latitude)
            delta_lat = radians(provider_latitude - latitude)
            delta_lon = radians(provider_longitude - longitude)

            a = (
                sin(delta_lat / 2) ** 2
                + cos(lat1)
                * cos(lat2)
                * sin(delta_lon / 2) ** 2
            )

            distance = 6371.0 * 2 * asin(sqrt(min(1.0, max(0.0, a))))

            if distance <= radius:
                provider_data = ProviderSerializer(
    provider,
    context={
        "request": request,
        "service_id": service_id,
    },
).data

                provider_data["distance_km"] = round(distance, 2)
                results.append(provider_data)

        results.sort(key=lambda item: item["distance_km"])

        return Response(results, status=status.HTTP_200_OK)


# =========================================================
# PROVIDER LIST
# =========================================================

class ProviderListView(generics.ListAPIView):
    serializer_class = ProviderSerializer

    def get_queryset(self):
        queryset = ProviderProfile.objects.select_related(
            "user",
            "category",
                ).filter(
    availability_status="available",
    verification_status=ProviderProfile.APPROVED,
    kyc__status=ProviderKYC.APPROVED,
)

        # Search
        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(bio__icontains=search)
                | Q(category__name__icontains=search)
            )

        # Category filter
        category = self.request.query_params.get("category")

        if category:
            queryset = queryset.filter(category_id=category)

       
        # Structured location filters
        country = self.request.query_params.get("country")
        province = self.request.query_params.get("province")
        district = self.request.query_params.get("district")
        city = self.request.query_params.get("city")

        if country:
            queryset = queryset.filter(
                country__iexact=country.strip()
            )

        if province:
            queryset = queryset.filter(
                province__iexact=province.strip()
            )

        if district:
            queryset = queryset.filter(
                district__iexact=district.strip()
            )

        if city:
            queryset = queryset.filter(
   
                city__iexact=city.strip()
            )
            
        # Service filter
        service_id = self.request.query_params.get("service_id")

        if service_id:
            queryset = queryset.filter(
                provider_services__service_id=service_id,
                provider_services__is_active=True,
            ).distinct()

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        service_id = self.request.query_params.get("service_id")

        if service_id:
            try:
                context["service_id"] = int(service_id)
            except (TypeError, ValueError):
                context["service_id"] = None

        return context


# =========================================================
# PROVIDER DETAIL
# =========================================================

class ProviderDetailView(generics.RetrieveAPIView):
    queryset = ProviderProfile.objects.select_related(
        "user",
        "category",
   ).filter(
    availability_status="available",
    verification_status=ProviderProfile.APPROVED,
    kyc__status=ProviderKYC.APPROVED,
)

    serializer_class = ProviderSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        service_id = self.request.query_params.get("service_id")

        if service_id:
            try:
                context["service_id"] = int(service_id)
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
                {"error": "Only providers can access this dashboard."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = ProviderProfile.objects.select_related(
                "user",
                "category",
            ).get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        bookings = Booking.objects.filter(provider=profile)
        kyc = ProviderKYC.objects.filter(
    provider=profile
).first()

        kyc_status = (
    kyc.status if kyc
    else ProviderKYC.NOT_SUBMITTED
)
        serializer = ProviderSerializer(
            profile,
            context={"request": request},
        )

        return Response(
    {
        "provider": serializer.data,

        "verification": {
            "application_status": profile.verification_status,
            "kyc_status": kyc_status,
            "is_verified": (
                profile.verification_status == ProviderProfile.APPROVED
                and kyc_status == ProviderKYC.APPROVED
            ),
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
            },
            status=status.HTTP_200_OK,
        )



# =========================================================
# PROVIDER AVAILABILITY
# =========================================================


class ProviderAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can change availability."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        availability = request.data.get("availability")

        allowed_states = [
            "available",
            "unavailable",
            "vacation",
        ]

        if availability not in allowed_states:
            return Response(
                {"error": "Invalid availability status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.availability_status = availability
        profile.available = availability == "available"

        profile.save(
            update_fields=[
                "availability_status",
                "available",
            ]
        )

        return Response(
            {
                "message": "Availability updated successfully.",
                "availability": profile.availability_status,
                "available": profile.available,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# PROVIDER SERVICE LOCATION UPDATE
# =========================================================


class ProviderLocationUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can update their service location."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        country = request.data.get("country")
        province = request.data.get("province")
        district = request.data.get("district")
        city = request.data.get("city", "")

        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        if not country or not province or not district:
            return Response(
                {"error": "Country, province and district are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Coordinates must be provided together.
        if (latitude is None) != (longitude is None):
            return Response(
                {"error": "Both latitude and longitude are required together."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate coordinates when provided.
        if latitude is not None:
            try:
                latitude = float(latitude)
                longitude = float(longitude)
            except (TypeError, ValueError):
                return Response(
                    {"error": "Invalid latitude or longitude."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not (-90 <= latitude <= 90):
                return Response(
                    {"error": "Latitude must be between -90 and 90."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not (-180 <= longitude <= 180):
                return Response(
                    {"error": "Longitude must be between -180 and 180."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        profile.country = str(country).strip()
        profile.province = str(province).strip()
        profile.district = str(district).strip()
        profile.city = str(city).strip()

        update_fields = [
            "country",
            "province",
            "district",
            "city",
        ]

        if latitude is not None:
            profile.latitude = latitude
            profile.longitude = longitude

            update_fields.extend([
                "latitude",
                "longitude",
            ])

        profile.save(update_fields=update_fields)

        return Response(
            {
                "message": "Service location updated successfully.",
                "location": {
                    "country": profile.country,
                    "province": profile.province,
                    "district": profile.district,
                    "city": profile.city,
                    "latitude": profile.latitude,
                    "longitude": profile.longitude,
                },
            },
            status=status.HTTP_200_OK,
        )


    
# =========================================================
# ADMIN PROVIDER LIST
# =========================================================

class AdminProviderListView(generics.ListAPIView):
    serializer_class = ProviderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != "admin":
            return ProviderProfile.objects.none()

        return ProviderProfile.objects.select_related(
            "user",
            "category",
        ).all().order_by("-id")

    def list(self, request, *args, **kwargs):
        if request.user.role != "admin":
            return Response(
                {"error": "Only administrators can access providers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().list(request, *args, **kwargs)



# =========================================================
# SAVED PROVIDERS
# =========================================================

class SavedProviderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    # Get saved providers
    def get(self, request):
        if request.user.role != "customer":
            return Response(
                {"error": "Only customers can access saved providers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        saved_providers = (
            SavedProvider.objects
            .filter(
                customer=request.user,
                provider__availability_status="available",
                provider__verification_status=ProviderProfile.APPROVED,
                provider__kyc__status=ProviderKYC.APPROVED,
            )
            .select_related(
                "provider",
                "provider__user",
                "provider__category",
            )
            .order_by("-created_at")
        )

        serializer = SavedProviderSerializer(
            saved_providers,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # Save provider
    def post(self, request):
        if request.user.role != "customer":
            return Response(
                {"error": "Only customers can save providers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        provider_id = request.data.get("provider")

        if not provider_id:
            return Response(
                {"error": "provider is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            provider = ProviderProfile.objects.get(
                id=provider_id,
                verification_status=ProviderProfile.APPROVED,
                availability_status="available",
                kyc__status=ProviderKYC.APPROVED,
            )
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Approved provider not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_provider, created = SavedProvider.objects.get_or_create(
            customer=request.user,
            provider=provider,
        )

        serializer = SavedProviderSerializer(
            saved_provider,
            context={"request": request},
        )

        if created:
            return Response(
                {
                    "message": "Provider saved successfully.",
                    "saved": True,
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "message": "Provider is already saved.",
                "saved": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )




# =========================================================
# REMOVE SAVED PROVIDER
# =========================================================

class SavedProviderDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, provider_id):
        if request.user.role != "customer":
            return Response(
                {"error": "Only customers can remove saved providers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            saved_provider = SavedProvider.objects.get(
                customer=request.user,
                provider_id=provider_id,
            )
        except SavedProvider.DoesNotExist:
            return Response(
                {"error": "Provider is not in your saved list."},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_provider.delete()

        return Response(
            {
                "message": "Provider removed successfully.",
                "saved": False,
            },
            status=status.HTTP_200_OK,
        )




# =========================================================
# PROVIDER KYC UPLOAD
# =========================================================

class ProviderKYCUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    REQUIRED_DOCUMENTS = [
        "citizenship_front",
        "citizenship_back",
        "verification_selfie",
    ]

    def post(self, request):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can submit KYC documents."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Require all three documents.
        missing = [
            field for field in self.REQUIRED_DOCUMENTS
            if field not in request.FILES
        ]

        if missing:
            return Response(
                {
                    "error": "All three KYC documents are required.",
                    "missing_documents": missing,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check existing KYC record without creating one.
        kyc = ProviderKYC.objects.filter(
            provider=profile
        ).first()

        if kyc and kyc.status != ProviderKYC.REJECTED:
            return Response(
                {
                    "error": (
                        "KYC documents can only be submitted initially "
                        "or resubmitted after rejection."
                    ),
                    "kyc_status": kyc.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate ALL documents before creating or changing a record.
        for field in self.REQUIRED_DOCUMENTS:
            uploaded_file = request.FILES[field]

            if uploaded_file.size > 5 * 1024 * 1024:
                return Response(
                    {"error": f"{field} must be 5 MB or smaller."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                get_image_dimensions(uploaded_file)
                uploaded_file.seek(0)
            except Exception:
                return Response(
                    {"error": f"{field} must be a valid image."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Create the record only after all documents pass validation.
        if kyc is None:
            kyc = ProviderKYC(provider=profile)

        # Replace previous rejected documents with new submissions.
        for field in self.REQUIRED_DOCUMENTS:
            setattr(kyc, field, request.FILES[field])

        kyc.status = ProviderKYC.PENDING
        kyc.rejection_reason = ""
        kyc.submitted_at = timezone.now()
        kyc.reviewed_at = None
        kyc.reviewed_by = None

        kyc.save()

        return Response(
            {
                "message": "KYC documents submitted successfully.",
                "kyc_status": kyc.status,
                "submitted_at": kyc.submitted_at,
            },
            status=status.HTTP_201_CREATED,
        )



# =========================================================
# PROVIDER KYC STATUS
# =========================================================

class ProviderKYCStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "provider":
            return Response(
                {"error": "Only providers can view their KYC status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = ProviderProfile.objects.get(user=request.user)
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            kyc = ProviderKYC.objects.get(provider=profile)
        except ProviderKYC.DoesNotExist:
            return Response(
                {
                    "kyc_status": ProviderKYC.NOT_SUBMITTED,
                    "rejection_reason": "",
                    "submitted_at": None,
                    "reviewed_at": None,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "kyc_status": kyc.status,
                "rejection_reason": kyc.rejection_reason,
                "submitted_at": kyc.submitted_at,
                "reviewed_at": kyc.reviewed_at,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# SECURE KYC DOCUMENT VIEW
# =========================================================

class ProviderKYCDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    ALLOWED_DOCUMENTS = {
        "citizenship_front",
        "citizenship_back",
        "verification_selfie",
    }

    def get(self, request, provider_id, document_type):

        if request.user.role not in ["provider", "admin"]:
            return Response(
                {"error": "You are not allowed to view KYC documents."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if document_type not in self.ALLOWED_DOCUMENTS:
            return Response(
                {"error": "Invalid document type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.role == "provider":
            owns_profile = ProviderProfile.objects.filter(
                id=provider_id,
                user=request.user,
            ).exists()

            if not owns_profile:
                return Response(
                    {"error": "You cannot access another provider's documents."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        try:
            kyc = ProviderKYC.objects.get(provider_id=provider_id)
        except ProviderKYC.DoesNotExist:
            return Response(
                {"error": "KYC submission not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        document = getattr(kyc, document_type)

        if not document or not document.name:
            return Response(
                {"error": "This document has not been uploaded."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            file_object = document.storage.open(document.name, "rb")
        except (FileNotFoundError, OSError):
            return Response(
                {"error": "Document file could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        content_type, _ = mimetypes.guess_type(document.name)

        if content_type not in ["image/jpeg", "image/png", "image/gif"]:
            content_type = "application/octet-stream"

        response = FileResponse(
            file_object,
            content_type=content_type,
        )

        response["Content-Disposition"] = (
            f'inline; filename="{document_type}"'
        )
        response["Cache-Control"] = "private, no-store"
        response["X-Content-Type-Options"] = "nosniff"

        return response


# =========================================================
# ADMIN PROVIDER KYC REVIEW
# =========================================================

class AdminProviderKYCReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def check_admin(self, request):
        return request.user.role == "admin"

    def get(self, request):
        if not self.check_admin(request):
            return Response(
                {"error": "Only administrators can review KYC submissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        submissions = ProviderKYC.objects.select_related(
            "provider",
            "provider__user",
            "reviewed_by",
        ).order_by("-submitted_at")

        results = []

        for kyc in submissions:
            provider = kyc.provider

            results.append({
                "kyc_id": kyc.id,
                "provider_id": provider.id,
                "provider_name": provider.user.get_full_name(),
                "provider_email": provider.user.email,
                "provider_verification_status": provider.verification_status,
                "kyc_status": kyc.status,
                "rejection_reason": kyc.rejection_reason,
                "submitted_at": kyc.submitted_at,
                "reviewed_at": kyc.reviewed_at,
                "reviewed_by": (
                    kyc.reviewed_by.email if kyc.reviewed_by else None
                ),
            })

        return Response(
            {"count": len(results), "results": results},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, kyc_id):
        if not self.check_admin(request):
            return Response(
                {"error": "Only administrators can review KYC submissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            kyc = ProviderKYC.objects.select_related(
                "provider",
                "provider__user",
            ).get(pk=kyc_id)
        except ProviderKYC.DoesNotExist:
            return Response(
                {"error": "KYC submission not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        decision = request.data.get("status")
        rejection_reason = request.data.get("rejection_reason", "").strip()

        if decision not in [ProviderKYC.APPROVED, ProviderKYC.REJECTED]:
            return Response(
                {"error": "Status must be 'approved' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if kyc.status != ProviderKYC.PENDING:
            return Response(
                {"error": "Only pending KYC submissions can be reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if decision == ProviderKYC.REJECTED and not rejection_reason:
            return Response(
                {"error": "A rejection reason is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        kyc.status = decision
        kyc.rejection_reason = (
            rejection_reason if decision == ProviderKYC.REJECTED else ""
        )
        kyc.reviewed_at = timezone.now()
        kyc.reviewed_by = request.user

        kyc.save(update_fields=[
            "status",
            "rejection_reason",
            "reviewed_at",
            "reviewed_by",
        ])
# Notify provider only when both approvals are complete.
        if decision == ProviderKYC.APPROVED:
           from notifications.services import notify_provider_fully_verified

        notify_provider_fully_verified(kyc.provider)
        return Response(
            {
                "message": f"KYC {decision} successfully.",
                "provider_id": kyc.provider_id,
                "kyc_status": kyc.status,
                "rejection_reason": kyc.rejection_reason,
                "reviewed_at": kyc.reviewed_at,
            },
            status=status.HTTP_200_OK,
        )
