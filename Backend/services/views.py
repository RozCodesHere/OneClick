from django.db.models import Q

from rest_framework import generics, serializers, status
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from .models import (
    Service,
    ServiceCategory,
    ServiceRequest,
    Quotation,
    ProviderService,
)

from .serializers import (
    ServiceCategorySerializer,
    ServiceSerializer,
    ServiceRequestSerializer,
    QuotationSerializer,
    ProviderServiceSerializer,
)


# =========================================================
# SERVICE CATEGORY
# =========================================================

class ServiceCategoryListView(ListAPIView):

    queryset = ServiceCategory.objects.all()

    serializer_class = ServiceCategorySerializer


# =========================================================
# SERVICE LIST
# =========================================================

class ServiceListView(ListAPIView):

    serializer_class = ServiceSerializer

    def get_queryset(self):

        queryset = Service.objects.filter(
            is_active=True
        )

        search = self.request.query_params.get(
            "search"
        )

        category = self.request.query_params.get(
            "category"
        )

        if search:

            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
            )

        if category:

            queryset = queryset.filter(
                category_id=category
            )

        return queryset


# =========================================================
# SERVICE DETAIL
# =========================================================

class ServiceDetailView(RetrieveAPIView):

    queryset = Service.objects.filter(
        is_active=True
    )

    serializer_class = ServiceSerializer


# =========================================================
# CUSTOMER SERVICE REQUESTS
# =========================================================

class ServiceRequestListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = ServiceRequestSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return ServiceRequest.objects.filter(
            customer=self.request.user
        )

    def perform_create(self, serializer):

        serializer.save(
            customer=self.request.user
        )

# =========================================================
# PROVIDER SERVICE MANAGEMENT
# =========================================================

class ProviderServiceListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = ProviderServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if self.request.user.role != "provider":
            return ProviderService.objects.none()

        try:
            provider = self.request.user.provider_profile
        except Exception:
            return ProviderService.objects.none()

        return ProviderService.objects.filter(
            provider=provider
        ).select_related(
            "service",
            "service__category",
        )

    def perform_create(self, serializer):

        if self.request.user.role != "provider":
            raise serializers.ValidationError(
                "Only providers can manage services."
            )

        try:
            provider = self.request.user.provider_profile
        except Exception:
            raise serializers.ValidationError(
                "Provider profile not found."
            )

        service = serializer.validated_data["service"]

        if not service.is_active:
            raise serializers.ValidationError(
                "This service is currently inactive."
            )

        if service.category_id != provider.category_id:
            raise serializers.ValidationError(
                "You can only add services from your provider category."
            )

        if ProviderService.objects.filter(
            provider=provider,
            service=service
        ).exists():

            raise serializers.ValidationError(
                "You already offer this service."
            )

        serializer.save(
            provider=provider
        )


class ProviderServiceDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = ProviderServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if self.request.user.role != "provider":
            return ProviderService.objects.none()

        try:
            provider = self.request.user.provider_profile
        except Exception:
            return ProviderService.objects.none()

        return ProviderService.objects.filter(
            provider=provider
        ).select_related(
            "service",
            "service__category",
        )

    def perform_update(self, serializer):

        if "service" in serializer.validated_data:

            service = serializer.validated_data["service"]

            if not service.is_active:
                raise serializers.ValidationError(
                    "This service is currently inactive."
                )

            provider = self.request.user.provider_profile

            if service.category_id != provider.category_id:
                raise serializers.ValidationError(
                    "You can only use services from your provider category."
                )

        serializer.save()
        
# =========================================================
# PROVIDER SERVICE REQUESTS
# =========================================================

class ProviderServiceRequestListView(
    generics.ListAPIView
):

    serializer_class = ServiceRequestSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        # Only providers can see provider requests
        if user.role != "provider":

            return ServiceRequest.objects.none()

        provider = getattr(
            user,
            "provider_profile",
            None
        )

        # Provider profile must exist
        if not provider:

            return ServiceRequest.objects.none()

        # Provider must be verified
        if not provider.verified:

            return ServiceRequest.objects.none()

        # Provider must be available
        if not provider.available:

            return ServiceRequest.objects.none()

        # Provider sees requests matching
        # their service category
        return ServiceRequest.objects.filter(
            service__category=provider.category,
            status__in=[
                ServiceRequest.STATUS_PENDING,
                ServiceRequest.STATUS_QUOTED,
            ],
        )


# =========================================================
# QUOTATION LIST + CREATE
# =========================================================

class QuotationListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = QuotationSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        # -------------------------------------------------
        # PROVIDER
        # -------------------------------------------------

        if user.role == "provider":

            provider = getattr(
                user,
                "provider_profile",
                None
            )

            if not provider:

                return Quotation.objects.none()

            return Quotation.objects.filter(
                provider=provider
            )

        # -------------------------------------------------
        # CUSTOMER
        # -------------------------------------------------

        if user.role == "customer":

            return Quotation.objects.filter(
                request__customer=user
            )

        # -------------------------------------------------
        # OTHER ROLES
        # -------------------------------------------------

        return Quotation.objects.none()

    def perform_create(self, serializer):

        user = self.request.user

        # -------------------------------------------------
        # ONLY PROVIDERS CAN CREATE QUOTATIONS
        # -------------------------------------------------

        if user.role != "provider":

            raise serializers.ValidationError(
                "Only providers can send quotations."
            )

        # -------------------------------------------------
        # GET PROVIDER PROFILE
        # -------------------------------------------------

        provider = getattr(
            user,
            "provider_profile",
            None
        )

        if not provider:

            raise serializers.ValidationError(
                "Provider profile not found."
            )

        # -------------------------------------------------
        # PROVIDER MUST BE VERIFIED
        # -------------------------------------------------

        if not provider.verified:

            raise serializers.ValidationError(
                "Only verified providers can send quotations."
            )

        # -------------------------------------------------
        # PROVIDER MUST BE AVAILABLE
        # -------------------------------------------------

        if not provider.available:

            raise serializers.ValidationError(
                "You must be available to send quotations."
            )

        # -------------------------------------------------
        # GET SERVICE REQUEST
        # -------------------------------------------------

        service_request = (
            serializer.validated_data["request"]
        )

        # -------------------------------------------------
        # REQUEST MUST BE AVAILABLE
        # -------------------------------------------------

        if service_request.status not in [
            ServiceRequest.STATUS_PENDING,
            ServiceRequest.STATUS_QUOTED,
        ]:

            raise serializers.ValidationError(
                "This service request is no longer available."
            )

        # -------------------------------------------------
        # PROVIDER CATEGORY MUST MATCH
        # -------------------------------------------------

        if (
            service_request.service.category
            != provider.category
        ):

            raise serializers.ValidationError(
                "You cannot quote for this service request."
            )

        # -------------------------------------------------
        # PREVENT DUPLICATE QUOTATION
        # -------------------------------------------------

        if Quotation.objects.filter(
            request=service_request,
            provider=provider,
        ).exists():

            raise serializers.ValidationError(
                "You have already sent a quotation for this request."
            )

        # -------------------------------------------------
        # CREATE QUOTATION
        # -------------------------------------------------

        quotation = serializer.save(
            provider=provider
        )

        # -------------------------------------------------
        # CHANGE REQUEST STATUS
        # -------------------------------------------------

        service_request.status = (
            ServiceRequest.STATUS_QUOTED
        )

        service_request.save(
            update_fields=["status"]
        )


# =========================================================
# ACCEPT QUOTATION
# =========================================================

class QuotationAcceptView(
    generics.UpdateAPIView
):

    serializer_class = QuotationSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        # Only customers can accept quotations
        if user.role != "customer":

            return Quotation.objects.none()

        # Customer can only access quotations
        # belonging to their own service requests
        return Quotation.objects.filter(
            request__customer=user
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        quotation = self.get_object()

        # -------------------------------------------------
        # CHECK REJECTED
        # -------------------------------------------------

        if quotation.status == Quotation.STATUS_REJECTED:

            return Response(
                {
                    "detail": (
                        "This quotation has already been rejected."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # CHECK ALREADY ACCEPTED
        # -------------------------------------------------

        if quotation.status == Quotation.STATUS_ACCEPTED:

            return Response(
                {
                    "detail": (
                        "This quotation is already accepted."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # ONLY PENDING OR FINAL CAN BE ACCEPTED
        # -------------------------------------------------

        if quotation.status not in [
            Quotation.STATUS_PENDING,
            Quotation.STATUS_FINAL,
        ]:

            return Response(
                {
                    "detail": (
                        "Only pending or final quotations "
                        "can be accepted."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # GET BOOKING DATA
        # -------------------------------------------------

        booking_date = request.data.get(
            "booking_date"
        )

        booking_time = request.data.get(
            "booking_time"
        )

        note = request.data.get(
            "note",
            ""
        )

        # -------------------------------------------------
        # VALIDATE BOOKING DATE
        # -------------------------------------------------

        if not booking_date:

            return Response(
                {
                    "detail": (
                        "Booking date is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # VALIDATE BOOKING TIME
        # -------------------------------------------------

        if not booking_time:

            return Response(
                {
                    "detail": (
                        "Booking time is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # CREATE BOOKING
        # -------------------------------------------------

        from bookings.models import Booking

        booking = Booking.objects.create(
            customer=request.user,
            provider=quotation.provider,
            service=quotation.request.service,
            booking_date=booking_date,
            booking_time=booking_time,
            address=quotation.request.address,
            note=note,
            total_price=quotation.price,
        )

        # -------------------------------------------------
        # ACCEPT SELECTED QUOTATION
        # -------------------------------------------------

        quotation.status = (
            Quotation.STATUS_ACCEPTED
        )

        quotation.save(
            update_fields=["status"]
        )

        # -------------------------------------------------
        # REJECT OTHER QUOTATIONS
        # -------------------------------------------------

        Quotation.objects.filter(
            request=quotation.request
        ).exclude(
            id=quotation.id
        ).update(
            status=Quotation.STATUS_REJECTED
        )

        # -------------------------------------------------
        # ACCEPT SERVICE REQUEST
        # -------------------------------------------------

        service_request = quotation.request

        service_request.status = (
            ServiceRequest.STATUS_ACCEPTED
        )

        service_request.save(
            update_fields=["status"]
        )

        # -------------------------------------------------
        # RETURN RESPONSE
        # -------------------------------------------------

        serializer = self.get_serializer(
            quotation
        )

        response_data = serializer.data

        response_data["booking_id"] = (
            booking.id
        )

        return Response(
            response_data,
            status=status.HTTP_200_OK
        )


# =========================================================
# REJECT QUOTATION
# =========================================================

class QuotationRejectView(
    generics.UpdateAPIView
):

    serializer_class = QuotationSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        # Only customers can reject quotations
        if user.role != "customer":

            return Quotation.objects.none()

        return Quotation.objects.filter(
            request__customer=user
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        quotation = self.get_object()

        # -------------------------------------------------
        # ACCEPTED QUOTATION CANNOT BE REJECTED
        # -------------------------------------------------

        if quotation.status == Quotation.STATUS_ACCEPTED:

            return Response(
                {
                    "detail": (
                        "An accepted quotation cannot be rejected."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # ALREADY REJECTED
        # -------------------------------------------------

        if quotation.status == Quotation.STATUS_REJECTED:

            return Response(
                {
                    "detail": (
                        "This quotation is already rejected."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # REJECT QUOTATION
        # -------------------------------------------------

        quotation.status = (
            Quotation.STATUS_REJECTED
        )

        quotation.save(
            update_fields=["status"]
        )

        # -------------------------------------------------
        # RETURN UPDATED QUOTATION
        # -------------------------------------------------

        serializer = self.get_serializer(
            quotation
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


# =========================================================
# CUSTOMER COUNTER-OFFER
# =========================================================

class QuotationCounterOfferView(
    generics.UpdateAPIView
):

    serializer_class = QuotationSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        # Only customers can make counter-offers
        if user.role != "customer":

            return Quotation.objects.none()

        return Quotation.objects.filter(
            request__customer=user
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        quotation = self.get_object()

        # -------------------------------------------------
        # ONLY PENDING QUOTATIONS
        # -------------------------------------------------

        if quotation.status != Quotation.STATUS_PENDING:

            return Response(
                {
                    "detail": (
                        "Only pending quotations "
                        "can receive a counter-offer."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # ONLY ONE COUNTER-OFFER
        # -------------------------------------------------

        if quotation.counter_price is not None:

            return Response(
                {
                    "detail": (
                        "You have already made "
                        "a counter-offer for this quotation."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # GET COUNTER DATA
        # -------------------------------------------------

        counter_price = request.data.get(
            "counter_price"
        )

        counter_message = request.data.get(
            "counter_message",
            ""
        )

        # -------------------------------------------------
        # VALIDATE PRICE
        # -------------------------------------------------

        if counter_price in [None, ""]:

            return Response(
                {
                    "detail": (
                        "Counter price is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            counter_price = float(
                counter_price
            )

        except (TypeError, ValueError):

            return Response(
                {
                    "detail": (
                        "Counter price must be a valid number."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # PRICE MUST BE POSITIVE
        # -------------------------------------------------

        if counter_price <= 0:

            return Response(
                {
                    "detail": (
                        "Counter price must be greater than zero."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # SAVE COUNTER-OFFER
        # -------------------------------------------------

        quotation.counter_price = (
            counter_price
        )

        quotation.counter_message = str(
            counter_message
        ).strip()

        quotation.status = (
            Quotation.STATUS_COUNTERED
        )

        quotation.save(
            update_fields=[
                "counter_price",
                "counter_message",
                "status",
            ]
        )

        # -------------------------------------------------
        # RETURN UPDATED QUOTATION
        # -------------------------------------------------

        serializer = self.get_serializer(
            quotation
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


# =========================================================
# PROVIDER FINAL OFFER
# =========================================================

class QuotationFinalOfferView(
    generics.UpdateAPIView
):

    serializer_class = QuotationSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        # Only providers can send final offers
        if user.role != "provider":

            return Quotation.objects.none()

        provider = getattr(
            user,
            "provider_profile",
            None
        )

        if not provider:

            return Quotation.objects.none()

        return Quotation.objects.filter(
            provider=provider
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        quotation = self.get_object()

        # -------------------------------------------------
        # ONLY COUNTERED QUOTATIONS
        # -------------------------------------------------

        if quotation.status != Quotation.STATUS_COUNTERED:

            return Response(
                {
                    "detail": (
                        "Only countered quotations "
                        "can receive a final offer."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # GET FINAL PRICE
        # -------------------------------------------------

        final_price = request.data.get(
            "final_price"
        )

        final_message = request.data.get(
            "final_message",
            ""
        )

        # -------------------------------------------------
        # VALIDATE PRICE
        # -------------------------------------------------

        if final_price in [None, ""]:

            return Response(
                {
                    "detail": (
                        "Final price is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            final_price = float(
                final_price
            )

        except (TypeError, ValueError):

            return Response(
                {
                    "detail": (
                        "Final price must be a valid number."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # PRICE MUST BE POSITIVE
        # -------------------------------------------------

        if final_price <= 0:

            return Response(
                {
                    "detail": (
                        "Final price must be greater than zero."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

     

        # -------------------------------------------------
        # SAVE FINAL OFFER
        # -------------------------------------------------

        quotation.price = (
            final_price
        )

        quotation.final_message = str(
            final_message
        ).strip()

        quotation.status = (
            Quotation.STATUS_FINAL
        )

        quotation.save(
            update_fields=[
                "price",
                "final_message",
                "status",
            ]
        )





        # -------------------------------------------------
        # RETURN UPDATED QUOTATION
        # -------------------------------------------------

        serializer = self.get_serializer(
            quotation
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )