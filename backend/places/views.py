from core.viewsets import ViewSetBase, WriteViewSetBase
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import PlaceFilter, VisitFilter, VisitItemFilter
from .models import Place, Visit, VisitItem
from .params_serializers import PlaceVisitParamsSerializer, VisitItemParamsSerializer
from .serializers import (
    PlaceDetailSerializer,
    PlaceListSerializer,
    PlaceWriteSerializer,
    VisitItemSerializer,
    VisitItemWriteSerializer,
    VisitSerializer,
    VisitWriteSerializer,
)


class PlaceViewSet(ViewSetBase):
    queryset = Place.objects.all()
    filterset_class = PlaceFilter
    search_fields = ("name", "category", "address")
    ordering_fields = ("created_at", "updated_at", "name")
    serializer_class = PlaceListSerializer
    serializer_action_classes = {
        "create": PlaceWriteSerializer,
        "update": PlaceWriteSerializer,
        "partial_update": PlaceWriteSerializer,
        "retrieve": PlaceDetailSerializer,
    }
    action_param_serializers = {
        "add_visit": PlaceVisitParamsSerializer,
    }

    def get_queryset(self):
        expand_param = self.request.query_params.get("expand")
        queryset = Place.objects.for_user(self.request.user)

        if self.action == "list":
            return queryset.with_list_expansion(expand_param)

        if self.action == "retrieve":
            return queryset.with_consumable_stats().with_detail_payload()

        return queryset

    @action(detail=True, methods=["post"], url_path="visits")
    def add_visit(self, request, pk=None):
        place = self.get_object()
        validated_data = self.validate_action_params(request)
        visit = Visit.objects.create(place=place, **validated_data)
        return Response(VisitSerializer(visit).data, status=status.HTTP_201_CREATED)


class VisitViewSet(WriteViewSetBase):
    queryset = Visit.objects.all()
    serializer_class = VisitWriteSerializer
    filterset_class = VisitFilter
    action_param_serializers = {
        "add_item": VisitItemParamsSerializer,
    }

    def get_queryset(self):
        return Visit.objects.for_user(self.request.user).with_expansion(
            self.request.query_params.get("expand")
        )

    @action(detail=True, methods=["post"], url_path="items")
    def add_item(self, request, pk=None):
        visit = self.get_object()
        validated_data = self.validate_action_params(request)
        item = VisitItem.objects.create(visit=visit, **validated_data)
        return Response(VisitItemSerializer(item).data, status=status.HTTP_201_CREATED)


class VisitItemViewSet(WriteViewSetBase):
    queryset = VisitItem.objects.all()
    serializer_class = VisitItemWriteSerializer
    filterset_class = VisitItemFilter

    def get_queryset(self):
        return VisitItem.objects.for_user(self.request.user).with_expansion(
            self.request.query_params.get("expand")
        )
