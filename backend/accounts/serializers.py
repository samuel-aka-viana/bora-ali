from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from core import messages
from core.storage_urls import build_public_media_url
from .models import UserProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "confirm_password")

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": str(messages.PASSWORDS_DO_NOT_MATCH)}
            )
        if User.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError(
                {"email": str(messages.EMAIL_ALREADY_EXISTS)}
            )
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(
        source="first_name",
        required=False,
        allow_blank=True,
        max_length=150,
    )
    nickname = serializers.CharField(required=False, allow_blank=True, max_length=80)
    profile_photo = serializers.FileField(required=False, allow_null=True, write_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "display_name",
            "nickname",
            "profile_photo",
            "profile_photo_url",
        )
        read_only_fields = ("id", "profile_photo_url")

    def validate_email(self, value):
        if (
            value
            and User.objects.filter(email__iexact=value)
            .exclude(pk=self.instance.pk if self.instance else None)
            .exists()
        ):
            raise serializers.ValidationError(str(messages.EMAIL_ALREADY_EXISTS))
        return value

    def get_profile_photo_url(self, obj):
        profile = self._get_profile(obj)
        if not profile.profile_photo:
            return ""
        return build_public_media_url(profile.profile_photo, self.context.get("request"))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["nickname"] = self._get_profile(instance).nickname
        return data

    def update(self, instance, validated_data):
        profile_data = {
            "nickname": validated_data.pop("nickname", serializers.empty),
            "profile_photo": validated_data.pop("profile_photo", serializers.empty),
        }

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile = self._get_profile(instance)
        if profile_data["nickname"] is not serializers.empty:
            profile.nickname = profile_data["nickname"]
        if profile_data["profile_photo"] is not serializers.empty:
            profile.profile_photo = profile_data["profile_photo"]
        profile.save()
        return instance

    def _get_profile(self, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError(str(messages.INVALID_PASSWORD))
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": str(messages.PASSWORDS_DO_NOT_MATCH)}
            )
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
