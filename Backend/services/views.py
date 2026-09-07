from django.db.models import Q
from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import Service, ServiceCategory
from .serializers import ServiceCategorySerializer, ServiceSerializer


class ServiceCategoryListView(ListAPIView):

    queryset = ServiceCategory.objects.all()

    serializer_class = ServiceCategorySerializer


class ServiceListView(ListAPIView):

    serializer_class = ServiceSerializer

    def get_queryset(self):

        queryset = Service.objects.filter(is_active=True)

        search = self.request.query_params.get("search")
        category = self.request.query_params.get("category")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
            )

        if category:
            queryset = queryset.filter(category_id=category)

        return queryset


class ServiceDetailView(RetrieveAPIView):

    queryset = Service.objects.filter(is_active=True)

    serializer_class = ServiceSerializer