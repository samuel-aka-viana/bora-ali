from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.settings import api_settings

from core import messages
from core.exceptions import (
    InvalidCredentialsException,
    SessionInvalidatedException,
    SessionNotFoundException,
)
from .models import UserSession

User = get_user_model()


class SingleSessionTokenObtainPairSerializer(TokenObtainPairSerializer):
    """On login, rotates the session_key and embeds it in both tokens."""
    default_error_messages = {
        "no_active_account": messages.INVALID_CREDENTIALS,
    }

    @classmethod
    def get_token(cls, user):
        session, _ = UserSession.objects.get_or_create(user=user)
        session.rotate()

        token = super().get_token(user)
        token["session_key"] = str(session.session_key)
        return token

    def validate(self, attrs):
        login_value = attrs.get("username", "")
        if login_value and "@" in login_value:
            username = (
                User.objects.filter(email__iexact=login_value)
                .values_list("username", flat=True)
                .first()
            )
            if username:
                attrs["username"] = username

        request = self.context.get("request")
        user = authenticate(
            request=request,
            username=attrs.get(self.username_field),
            password=attrs.get("password"),
        )
        if not user or not user.is_active:
            raise InvalidCredentialsException

        return build_token_pair_for_user(user)


def build_token_pair_for_user(user):
    refresh = SingleSessionTokenObtainPairSerializer.get_token(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class SingleSessionTokenRefreshSerializer(TokenRefreshSerializer):
    """On refresh, validates that the refresh token's session_key still matches the DB."""

    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])

        token_session_key = refresh.get("session_key")
        if token_session_key:
            user_id = refresh.get(api_settings.USER_ID_CLAIM)
            try:
                user = User.objects.select_related("active_session").get(pk=user_id)
                if str(user.active_session.session_key) != str(token_session_key):
                    raise SessionInvalidatedException
            except (User.DoesNotExist, UserSession.DoesNotExist):
                raise SessionNotFoundException

        data = super().validate(attrs)

        # Carry session_key forward into the new rotated refresh token
        if "refresh" in data and token_session_key:
            new_refresh = self.token_class(data["refresh"])
            new_refresh["session_key"] = str(token_session_key)
            data["refresh"] = str(new_refresh)

        return data
