from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import PlaceFilter, VisitFilter, VisitItemFilter
from .models import Place, Visit, VisitItem
from .serializers import (
    PlaceDetailSerializer,
    PlaceListSerializer,
    PlaceWriteSerializer,
    VisitItemSerializer,
    VisitItemWriteSerializer,
    VisitSerializer,
    VisitWriteSerializer,
)


class PlaceViewSet(viewsets.ModelViewSet):
    filterset_class = PlaceFilter
    search_fields = ("name", "category", "address")
    ordering_fields = ("created_at", "updated_at", "name")

    def get_queryset(self):
        return Place.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return PlaceWriteSerializer
        if self.action == "retrieve":
            return PlaceDetailSerializer
        return PlaceListSerializer

    @action(detail=True, methods=["post"], url_path="visits")
    def add_visit(self, request, pk=None):
        place = self.get_object()
        serializer = VisitWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        visit = serializer.save(place=place)
        return Response(VisitSerializer(visit).data, status=status.HTTP_201_CREATED)


class VisitViewSet(mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = VisitWriteSerializer
    filterset_class = VisitFilter

    def get_queryset(self):
        return Visit.objects.filter(place__user=self.request.user)

    @action(detail=True, methods=["post"], url_path="items")
    def add_item(self, request, pk=None):
        visit = self.get_object()
        serializer = VisitItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(visit=visit)
        return Response(VisitItemSerializer(item).data, status=status.HTTP_201_CREATED)


class VisitItemViewSet(mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = VisitItemWriteSerializer
    filterset_class = VisitItemFilter

    def get_queryset(self):
        return VisitItem.objects.filter(visit__place__user=self.request.user)
