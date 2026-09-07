from django.db import models


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Service Categories"

    def __str__(self):
        return self.name


class Service(models.Model):
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.CASCADE,
        related_name="services",
    )

    name = models.CharField(max_length=150)

    description = models.TextField(blank=True)

    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    estimated_duration = models.PositiveIntegerField(
        help_text="Duration in minutes"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name