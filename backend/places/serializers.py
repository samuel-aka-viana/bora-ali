import re

from rest_flex_fields import FlexFieldsModelSerializer
from rest_framework import serializers

from core.storage_urls import build_public_media_url
from .models import Place, Visit, VisitItem


def _extract_coords(url: str) -> tuple[float, float] | tuple[None, None]:
    """Extract (lat, lng) from a Google Maps URL, or return (None, None)."""
    patterns = [
        r"@(-?\d+\.\d+),(-?\d+\.\d+)",
        r"[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)",
        r"[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)",
    ]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return float(m.group(1)), float(m.group(2))
    return None, None


class VisitItemSerializer(FlexFieldsModelSerializer):
    photo = serializers.SerializerMethodField()

    def get_photo(self, obj):
        return build_public_media_url(obj.photo, self.context.get("request"))

    class Meta:
        model = VisitItem
        fields = (
            "public_id",
            "visit",
            "name",
            "type",
            "rating",
            "price",
            "would_order_again",
            "notes",
            "photo",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("public_id", "visit", "created_at", "updated_at")


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
        )


class VisitSerializer(FlexFieldsModelSerializer):
    photo = serializers.SerializerMethodField()
    items = VisitItemSerializer(many=True, read_only=True)

    def get_photo(self, obj):
        return build_public_media_url(obj.photo, self.context.get("request"))

    class Meta:
        model = Visit
        fields = (
            "public_id",
            "place",
            "visited_at",
            "environment_rating",
            "service_rating",
            "overall_rating",
            "would_return",
            "general_notes",
            "photo",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("public_id", "place", "items", "created_at", "updated_at")
        expandable_fields = {
            "place": ("places.serializers.PlaceListSerializer", {"read_only": True}),
            "items": (
                "places.serializers.VisitItemSerializer",
                {"many": True, "read_only": True},
            ),
        }


class VisitExpandSerializer(FlexFieldsModelSerializer):
    photo = serializers.SerializerMethodField()

    def get_photo(self, obj):
        return build_public_media_url(obj.photo, self.context.get("request"))

    class Meta:
        model = Visit
        fields = (
            "public_id",
            "place",
            "visited_at",
            "environment_rating",
            "service_rating",
            "overall_rating",
            "would_return",
            "general_notes",
            "photo",
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
        )


class PlaceListSerializer(FlexFieldsModelSerializer):
    cover_photo = serializers.SerializerMethodField()

    def get_cover_photo(self, obj):
        return build_public_media_url(obj.cover_photo, self.context.get("request"))

    class Meta:
        model = Place
        fields = (
            "public_id",
            "name",
            "category",
            "address",
            "status",
            "cover_photo",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("public_id", "created_at", "updated_at")
        expandable_fields = {
            "visits": (
                "places.serializers.VisitExpandSerializer",
                {"many": True, "read_only": True},
            ),
        }


class PlaceDetailSerializer(FlexFieldsModelSerializer):
    cover_photo = serializers.SerializerMethodField()
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

    def get_cover_photo(self, obj):
        return build_public_media_url(obj.cover_photo, self.context.get("request"))

    class Meta:
        model = Place
        fields = (
            "public_id",
            "name",
            "category",
            "address",
            "instagram_url",
            "maps_url",
            "latitude",
            "longitude",
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
        read_only_fields = (
            "public_id",
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
            "public_id",
            "name",
            "category",
            "address",
            "instagram_url",
            "maps_url",
            "latitude",
            "longitude",
            "status",
            "notes",
            "cover_photo",
        )
        read_only_fields = ("public_id",)

    def _sync_coords(self, validated_data: dict) -> dict:
        has_manual_coords = (
            validated_data.get("latitude") is not None
            and validated_data.get("longitude") is not None
        )
        if has_manual_coords:
            return validated_data

        maps_url = validated_data.get("maps_url", "")
        if maps_url:
            lat, lng = _extract_coords(maps_url)
            validated_data["latitude"] = lat
            validated_data["longitude"] = lng
        return validated_data

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(self._sync_coords(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._sync_coords(validated_data))
