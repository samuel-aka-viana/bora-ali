from rest_framework import serializers

from .models import Place, Visit, VisitItem


class VisitItemSerializer(serializers.ModelSerializer):
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


class VisitItemWriteSerializer(serializers.ModelSerializer):
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


class VisitSerializer(serializers.ModelSerializer):
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


class VisitWriteSerializer(serializers.ModelSerializer):
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


class PlaceListSerializer(serializers.ModelSerializer):
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


class PlaceDetailSerializer(serializers.ModelSerializer):
    visits = VisitSerializer(many=True, read_only=True)
    consumables_count = serializers.SerializerMethodField()
    average_consumable_rating = serializers.SerializerMethodField()
    total_consumed_amount = serializers.SerializerMethodField()

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

    def _visit_items(self, obj):
        return [item for visit in obj.visits.all() for item in visit.items.all()]

    def get_consumables_count(self, obj):
        return len(self._visit_items(obj))

    def get_average_consumable_rating(self, obj):
        ratings = [
            item.rating for item in self._visit_items(obj) if item.rating is not None
        ]
        if not ratings:
            return None
        return float(round(sum(ratings) / len(ratings), 2))

    def get_total_consumed_amount(self, obj):
        prices = [
            item.price for item in self._visit_items(obj) if item.price is not None
        ]
        if not prices:
            return None
        return f"{sum(prices):.2f}"


class PlaceWriteSerializer(serializers.ModelSerializer):
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
