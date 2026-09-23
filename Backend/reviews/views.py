from rest_framework import status
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateView(APIView):

    def get_permissions(self):

        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def get(self, request):

        provider = request.query_params.get(
            "provider"
        )

        reviews = Review.objects.all()

        if provider:
            reviews = reviews.filter(
                provider_id=provider
            )

        serializer = ReviewSerializer(
            reviews,
            many=True,
        )

        return Response(
            serializer.data
        )

    def post(self, request):

        provider_id = request.data.get(
            "provider"
        )

        if not provider_id:
            return Response(
                {
                    "provider": [
                        "Provider is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent duplicate review
        existing_review = Review.objects.filter(
            customer=request.user,
            provider_id=provider_id,
        ).first()

        if existing_review:

            return Response(
                {
                    "error": (
                        "You have already reviewed "
                        "this provider."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewSerializer(
            data=request.data
        )

        if serializer.is_valid():

            review = serializer.save(
                customer=request.user
            )

            return Response(
                ReviewSerializer(review).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )