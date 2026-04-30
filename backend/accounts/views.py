from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.exceptions import InvalidTokenException
from .serializers import RegisterSerializer, UserSerializer
from .throttles import AuthRateThrottle
from .token_serializers import (
    SingleSessionTokenObtainPairSerializer,
    SingleSessionTokenRefreshSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]
    throttle_scope = "auth"


class ThrottledLoginView(TokenObtainPairView):
    serializer_class = SingleSessionTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]
    throttle_scope = "auth"


class ThrottledRefreshView(TokenRefreshView):
    serializer_class = SingleSessionTokenRefreshSerializer
    throttle_classes = [AuthRateThrottle]
    throttle_scope = "auth"


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data["refresh"]).blacklist()
        except Exception:
            raise InvalidTokenException
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
