from django.http import JsonResponse

from users.models import User
from providers.models import ProviderProfile
from services.models import ServiceCategory
from bookings.models import Booking


def public_stats(request):
    """
    Public statistics for the OneClick homepage.
    Values come directly from the database.
    """

    verified_providers = ProviderProfile.objects.filter(
        verified=True,
        available=True
    ).count()

    customers = User.objects.filter(
        role="customer"
    ).count()

    service_categories = ServiceCategory.objects.filter(
        is_active=True
    ).count()

    bookings = Booking.objects.count()

    return JsonResponse({
        "verified_providers": verified_providers,
        "customers": customers,
        "service_categories": service_categories,
        "bookings": bookings,
    })