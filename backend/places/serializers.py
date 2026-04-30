from rest_flex_fields import FlexFieldsModelSerializer
from rest_framework import serializers

from .models import Place, Visit, VisitItem


class VisitItemSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = VisitItem
        fields = (
            "id",
            "visit",
            "name",
            "type",
            "rating",
            "price",
            "would_order_again",
            "notes",
            "photo",
            "photo_path",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "visit", "created_at", "updated_at")


class VisitItemWriteSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = VisitItem
        fields = (
            "name",
            "type",
            "rating",
            "price",
            "would_order_again",
            "notes",
            "photo",
            "photo_path",
        )


class VisitSerializer(FlexFieldsModelSerializer):
    items = VisitItemSerializer(many=True, read_only=True)

    class Meta:
        model = Visit
        fields = (
            "id",
            "place",
            "visited_at",
            "environment_rating",
            "service_rating",
            "overall_rating",
            "would_return",
            "general_notes",
            "photo",
            "photo_path",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "place", "items", "created_at", "updated_at")
        expandable_fields = {
            "place": ("places.serializers.PlaceListSerializer", {"read_only": True}),
            "items": (
                "places.serializers.VisitItemSerializer",
                {"many": True, "read_only": True},
            ),
        }


class VisitExpandSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Visit
        fields = (
            "id",
            "place",
            "visited_at",
            "environment_rating",
            "service_rating",
            "overall_rating",
            "would_return",
            "general_notes",
            "photo",
            "photo_path",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
        expandable_fields = {
            "place": ("places.serializers.PlaceListSerializer", {"read_only": True}),
            "items": (
                "places.serializers.VisitItemSerializer",
                {"many": True, "read_only": True},
            ),
        }


class VisitWriteSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Visit
        fields = (
            "visited_at",
            "environment_rating",
            "service_rating",
            "overall_rating",
            "would_return",
            "general_notes",
            "photo",
            "photo_path",
        )


class PlaceListSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Place
        fields = (
            "id",
            "name",
            "category",
            "address",
            "status",
            "cover_photo",
            "created_at",
            "updated_at",
        )
        expandable_fields = {
            "visits": (
                "places.serializers.VisitExpandSerializer",
                {"many": True, "read_only": True},
            ),
        }


class PlaceDetailSerializer(FlexFieldsModelSerializer):
    visits = VisitSerializer(many=True, read_only=True)
    consumables_count = serializers.IntegerField(read_only=True)
    average_consumable_rating = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    total_consumed_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Place
        fields = (
            "id",
            "name",
            "category",
            "address",
            "instagram_url",
            "maps_url",
            "status",
            "notes",
            "cover_photo",
            "visits",
            "consumables_count",
            "average_consumable_rating",
            "total_consumed_amount",
            "created_at",
            "updated_at",
        )
        expandable_fields = {
            "visits": (
                "places.serializers.VisitSerializer",
                {"many": True, "read_only": True},
            ),
        }


class PlaceWriteSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Place
        fields = (
            "id",
            "name",
            "category",
            "address",
            "instagram_url",
            "maps_url",
            "status",
            "notes",
            "cover_photo",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
