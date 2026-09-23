from django.contrib.auth import get_user_model

from rest_framework import serializers


User = get_user_model()


# =========================================================
# REGISTER SERIALIZER
# =========================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = User

        fields = (
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "role",
        )

    def create(self, validated_data):

        password = validated_data.pop("password")

        user = User(
            **validated_data
        )

        user.set_password(password)

        user.save()

        return user


# =========================================================
# USER SERIALIZER
# Used by /api/users/me/
# =========================================================

class UserSerializer(serializers.ModelSerializer):

    class Meta:

        model = User

        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "is_active",
            "date_joined",
        )

        read_only_fields = (
            "id",
            "email",
            "role",
            "is_active",
            "date_joined",
        )