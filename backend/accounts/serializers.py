from core import messages
from core.storage_urls import build_public_media_url
from core.validators import validate_image_upload
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .exceptions import GoogleIdentityPasswordChangeNotAllowedException
from .models import GoogleIdentity, UserProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # "id" removido: evita expor PK sequencial no registro.
        fields = ("username", "email", "password", "confirm_password")

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
    nickname = serializers.CharField(
        required=False, allow_blank=True, max_length=80
    )
    profile_photo = serializers.ImageField(
        required=False,
        allow_null=True,
        write_only=True,
        validators=[validate_image_upload],
    )
    profile_photo_url = serializers.SerializerMethodField()
    is_google_account = serializers.SerializerMethodField()

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
            "is_google_account",
        )
        read_only_fields = ("id", "profile_photo_url", "is_google_account")

    def validate_email(self, value):
        if (
            value
            and User.objects.filter(email__iexact=value)
            .exclude(pk=self.instance.pk if self.instance else None)
            .exists()
        ):
            raise serializers.ValidationError(
                str(messages.EMAIL_ALREADY_EXISTS)
            )
        return value

    def get_profile_photo_url(self, obj):
        profile = self._get_profile(obj)
        if not profile.profile_photo:
            return ""
        return build_public_media_url(
            profile.profile_photo, self.context.get("request")
        )

    def get_is_google_account(self, obj):
        return GoogleIdentity.objects.filter(user=obj).exists()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["nickname"] = self._get_profile(instance).nickname
        return data

    def update(self, instance, validated_data):
        from core.image_service import ImageService

        profile_data = {
            "nickname": validated_data.pop("nickname", serializers.empty),
            "profile_photo": validated_data.pop(
                "profile_photo", serializers.empty
            ),
        }

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile = self._get_profile(instance)

        if profile_data["nickname"] is not serializers.empty:
            profile.nickname = profile_data["nickname"]

        photo_file = profile_data["profile_photo"]
        if photo_file is not serializers.empty:
            old_path = (
                profile.profile_photo.name if profile.profile_photo else None
            )
            if old_path:
                ImageService.delete(old_path)
            if photo_file is None:
                profile.profile_photo = None
            else:
                path = ImageService.save(photo_file, instance.id, "profiles")
                profile.profile_photo = path

        profile.save()
        return instance

    def _get_profile(self, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if self._is_google_account(user):
            raise GoogleIdentityPasswordChangeNotAllowedException
        if not user.check_password(value):
            raise serializers.ValidationError(str(messages.INVALID_PASSWORD))
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": str(messages.PASSWORDS_DO_NOT_MATCH)}
            )
        user = self.context["request"].user
        if self._is_google_account(user):
            raise GoogleIdentityPasswordChangeNotAllowedException
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user

    def _is_google_account(self, user) -> bool:
        return GoogleIdentity.objects.filter(user=user).exists()


class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField()
