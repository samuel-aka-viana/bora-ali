from core.media_views import serve_user_media
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import IsAuthenticated

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("places.urls")),
    path("api/media/<path:path>", serve_user_media, name="serve-user-media"),
]

# Documentação da API disponível apenas em DEBUG ou para usuários autenticados.
# Em produção, exige autenticação para evitar expor o contrato da API.
if settings.DEBUG:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/docs/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
    ]
else:
    urlpatterns += [
        path(
            "api/schema/",
            SpectacularAPIView.as_view(permission_classes=[IsAuthenticated]),
            name="schema",
        ),
        path(
            "api/docs/",
            SpectacularSwaggerView.as_view(
                url_name="schema", permission_classes=[IsAuthenticated]
            ),
            name="swagger-ui",
        ),
    ]
