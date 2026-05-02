# Backend: API (Serializers, ViewSets, Rotas)

## Ownership — regra obrigatória

```python
# Place
def get_queryset(self):
    return Place.objects.filter(user=self.request.user)

# Visit
def get_queryset(self):
    return Visit.objects.filter(place__user=self.request.user)

# VisitItem
def get_queryset(self):
    return VisitItem.objects.filter(visit__place__user=self.request.user)
```

## ViewSet padrão

```python
class PlaceViewSet(viewsets.ModelViewSet):
    lookup_field = "public_id"
    serializer_class = PlaceDetailSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status"]
    search_fields = ["name", "category", "address"]
    ordering_fields = ["name", "updated_at", "created_at"]

    def get_queryset(self):
        return Place.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return PlaceWriteSerializer
        return PlaceDetailSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

## Visitas aninhadas

```python
class VisitViewSet(viewsets.ModelViewSet):
    lookup_field = "public_id"

    def get_queryset(self):
        return Visit.objects.filter(
            place__public_id=self.kwargs["place_public_id"],
            place__user=self.request.user,
        )

    def perform_create(self, serializer):
        place = get_object_or_404(Place, public_id=self.kwargs["place_public_id"], user=self.request.user)
        serializer.save(place=place)
```

## Endpoints

```
GET    /api/places/
POST   /api/places/
GET    /api/places/{public_id}/
PATCH  /api/places/{public_id}/
DELETE /api/places/{public_id}/
GET    /api/places/{public_id}/visits/
POST   /api/places/{public_id}/visits/
GET    /api/visits/{public_id}/
PATCH  /api/visits/{public_id}/
DELETE /api/visits/{public_id}/
GET    /api/visits/{public_id}/items/
POST   /api/visits/{public_id}/items/
PATCH  /api/visits/{public_id}/items/{public_id}/
DELETE /api/visits/{public_id}/items/{public_id}/
GET    /api/media/<path>
GET    /api/docs/
```

## config/urls.py

```python
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from core.media_views import serve_user_media

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("places.urls")),
    path("api/media/<path:path>", serve_user_media),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
```

## Paginação — resposta padrão

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/places/?page=2",
  "previous": null,
  "results": []
}
```

## Maps — extrair coordenadas de URL

```python
# places/serializers.py
import re

COORD_RE = re.compile(r"@(-?\d+\.\d+),(-?\d+\.\d+)")

class PlaceWriteSerializer(serializers.ModelSerializer):
    def _sync_coords(self, maps_url):
        m = COORD_RE.search(maps_url or "")
        if m:
            return float(m.group(1)), float(m.group(2))
        return None, None

    def validate(self, data):
        if "maps_url" in data:
            data["latitude"], data["longitude"] = self._sync_coords(data["maps_url"])
        return data
```
