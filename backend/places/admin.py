from django.contrib import admin

from .models import Place, Visit, VisitItem


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "status", "user", "created_at")
    list_filter = ("status", "category")
    search_fields = ("name", "category", "address")


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("place", "visited_at", "overall_rating", "would_return")
    list_filter = ("would_return",)
    search_fields = ("place__name",)


@admin.register(VisitItem)
class VisitItemAdmin(admin.ModelAdmin):
    list_display = ("name", "visit", "type", "rating", "price")
    list_filter = ("type", "would_order_again")
    search_fields = ("name",)
