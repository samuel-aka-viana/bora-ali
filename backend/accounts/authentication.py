from rest_framework_simplejwt.authentication import JWTAuthentication

from core.exceptions import SessionExpiredException, SessionNotFoundException
from .models import UserSession


class SingleSessionJWTAuthentication(JWTAuthentication):
    """Rejects access tokens whose session_key no longer matches the DB record.

    When a user logs in from a new device, the session_key is rotated,
    immediately invalidating all tokens issued in prior sessions.
    """

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        token_session_key = validated_token.get("session_key")

        if not token_session_key:
            return user

        try:
            if str(user.active_session.session_key) != str(token_session_key):
                raise SessionExpiredException
        except UserSession.DoesNotExist:
            raise SessionNotFoundException

        return user
