from django.urls import path

from .views import public_stats


urlpatterns = [
    path("", public_stats, name="public-stats"),
]