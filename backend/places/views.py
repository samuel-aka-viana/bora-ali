from core.viewsets import ViewSetBase, WriteViewSetBase
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import PlaceFilter, VisitFilter, VisitItemFilter
from .models import Place, Visit, VisitItem
from .params_serializers import (PlaceVisitParamsSerializer,
                                 VisitItemParamsSerializer)
from .serializers import (PlaceDetailSerializer, PlaceListSerializer,
                          PlaceWriteSerializer, VisitDetailSerializer,
                          VisitItemSerializer, VisitItemWriteSerializer,
                          VisitSummarySerializer, VisitWriteSerializer)


class PlaceViewSet(ViewSetBase):
    queryset = Place.objects.all()
    lookup_field = "public_id"
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
            return queryset.with_consumable_stats().with_detail_payload(
                self.request.query_params.get("expand")
            )

        return queryset

    @action(detail=True, methods=["post"], url_path="visits")
    def add_visit(self, request, public_id=None):
        place = self.get_object()
        serializer = self.get_action_serializer_class()(
            data=request.data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        visit = serializer.save(place=place)
        return Response(
            VisitSummarySerializer(visit).data, status=status.HTTP_201_CREATED
        )


class VisitViewSet(WriteViewSetBase):
    queryset = Visit.objects.all()
    lookup_field = "public_id"
    serializer_class = VisitWriteSerializer
    serializer_action_classes = {
        "retrieve": VisitDetailSerializer,
    }
    filterset_class = VisitFilter
    action_param_serializers = {
        "add_item": VisitItemParamsSerializer,
    }

    def get_queryset(self):
        if self.action == "retrieve":
            return Visit.objects.for_user(self.request.user).with_detail_payload(
                self.request.query_params.get("expand")
            )

        return Visit.objects.for_user(self.request.user).with_expansion(
            self.request.query_params.get("expand")
        )

    def get_serializer_class(self):
        serializer_class = self.serializer_action_classes.get(self.action)
        if serializer_class is not None:
            return serializer_class
        return super().get_serializer_class()

    @action(detail=True, methods=["post"], url_path="items")
    def add_item(self, request, public_id=None):
        visit = self.get_object()
        serializer = self.get_action_serializer_class()(
            data=request.data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.save(visit=visit)
        return Response(
            VisitItemSerializer(item).data, status=status.HTTP_201_CREATED
        )


class VisitItemViewSet(WriteViewSetBase):
    queryset = VisitItem.objects.all()
    lookup_field = "public_id"
    serializer_class = VisitItemWriteSerializer
    filterset_class = VisitItemFilter

    def get_queryset(self):
        return VisitItem.objects.for_user(self.request.user).with_expansion(
            self.request.query_params.get("expand")
        )
