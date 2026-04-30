from rest_framework import serializers

from .models import Place, Visit, VisitItem


class VisitItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitItem
        fields = (
            "id", "visit", "name", "type", "rating", "price",
            "would_order_again", "notes", "photo_path",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "visit", "created_at", "updated_at")


class VisitItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitItem
        fields = ("name", "type", "rating", "price", "would_order_again", "notes", "photo_path")


class VisitSerializer(serializers.ModelSerializer):
    items = VisitItemSerializer(many=True, read_only=True)

    class Meta:
        model = Visit
        fields = (
            "id", "place", "visited_at", "environment_rating",
            "service_rating", "overall_rating", "would_return",
            "general_notes", "photo_path", "items",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "place", "items", "created_at", "updated_at")


class VisitWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = (
            "visited_at", "environment_rating", "service_rating",
            "overall_rating", "would_return", "general_notes", "photo_path",
        )


class PlaceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ("id", "name", "category", "address", "status", "cover_photo_path", "created_at", "updated_at")


class PlaceDetailSerializer(serializers.ModelSerializer):
    visits = VisitSerializer(many=True, read_only=True)

    class Meta:
        model = Place
        fields = (
            "id", "name", "category", "address", "instagram_url",
            "maps_url", "status", "notes", "cover_photo_path",
            "visits", "created_at", "updated_at",
        )


class PlaceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = (
            "name", "category", "address", "instagram_url",
            "maps_url", "status", "notes", "cover_photo_path",
        )

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
