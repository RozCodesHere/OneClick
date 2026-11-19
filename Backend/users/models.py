
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

from providers.cloudinary_storage import CloudinaryImageStorage

class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(
            email=email,
            password=password,
            **extra_fields
        )


class User(AbstractUser):

    username = None

    CUSTOMER = "customer"
    PROVIDER = "provider"
    ADMIN = "admin"

    ROLE_CHOICES = [
        (CUSTOMER, "Customer"),
        (PROVIDER, "Provider"),
        (ADMIN, "Admin"),
    ]

    email = models.EmailField(
        unique=True,
    )
    email_verified = models.BooleanField(default=False)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=CUSTOMER,
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
    )

    # Customer service location
    country = models.CharField(
        max_length=100,
        default="Nepal",
    )

    province = models.CharField(
        max_length=100,
        blank=True,
    )

    district = models.CharField(
        max_length=100,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )
        # User Settings

    notification_preferences = models.JSONField(
        default=dict,
        blank=True,
    )

    privacy_preferences = models.JSONField(
        default=dict,
        blank=True,
    )

    appearance_preferences = models.JSONField(
        default=dict,
        blank=True,
    )

    preferred_payment_method = models.CharField(
        max_length=20,
        default="cash",
        choices=[
            ("cash", "Cash on Service"),
            ("khalti", "Khalti"),
            ("esewa", "eSewa"),
            ("card", "Credit Card"),
        ],
    )
    profile_picture = models.ImageField(
    storage=CloudinaryImageStorage(),
    upload_to="profiles/",
    blank=True,
    null=True,
)

    name_changed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class EmailOTP(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="email_otp"
    )
    otp_hash = models.CharField(max_length=128)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OTP for {self.user.email}"
