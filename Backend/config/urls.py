from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/users/", include("users.urls")),
    path("api/services/", include("services.urls")),
    path("api/providers/", include("providers.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/support/", include("support.urls")),
    path("api/stats/", include("core.urls")),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)