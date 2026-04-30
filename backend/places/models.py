from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from .managers import PlaceQuerySet, VisitItemQuerySet, VisitQuerySet


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="created at", db_column="created_at"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="updated at", db_column="updated_at"
    )

    class Meta:
        abstract = True


class PlaceStatus(models.TextChoices):
    WANT_TO_VISIT = "want_to_visit", _("Want to visit")
    VISITED = "visited", _("Visited")
    FAVORITE = "favorite", _("Favorite")
    WOULD_NOT_RETURN = "would_not_return", _("Would not return")


class VisitItemType(models.TextChoices):
    SWEET = "sweet", _("Sweet")
    SAVORY = "savory", _("Savory")
    DRINK = "drink", _("Drink")
    COFFEE = "coffee", _("Coffee")
    JUICE = "juice", _("Juice")
    DESSERT = "dessert", _("Dessert")
    OTHER = "other", _("Other")


class Place(TimeStampedModel):
    objects = PlaceQuerySet.as_manager()

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="places",
        verbose_name="user",
        db_column="user_id",
    )
    name = models.CharField(max_length=200, verbose_name="name", db_column="name")
    category = models.CharField(
        max_length=100, verbose_name="category", db_column="category"
    )
    address = models.CharField(
        max_length=300, blank=True, verbose_name="address", db_column="address"
    )
    instagram_url = models.URLField(
        blank=True, verbose_name="instagram url", db_column="instagram_url"
    )
    maps_url = models.URLField(
        blank=True, verbose_name="maps url", db_column="maps_url"
    )
    status = models.CharField(
        max_length=32,
        choices=PlaceStatus.choices,
        default=PlaceStatus.WANT_TO_VISIT,
        verbose_name="status",
        db_column="status",
    )
    notes = models.TextField(blank=True, verbose_name="notes", db_column="notes")
    cover_photo = models.ImageField(
        upload_to="places/covers/",
        blank=True,
        null=True,
        verbose_name="cover photo",
        db_column="cover_photo",
    )

    class Meta:
        db_table = "places_place"
        ordering = ("-created_at",)
        verbose_name = "place"
        verbose_name_plural = "places"

    def __str__(self) -> str:
        return self.name


class Visit(TimeStampedModel):
    objects = VisitQuerySet.as_manager()

    place = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name="visits",
        verbose_name="place",
        db_column="place_id",
    )
    visited_at = models.DateTimeField(verbose_name="visited at", db_column="visited_at")
    environment_rating = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="environment rating",
        db_column="environment_rating",
        null=True,
        blank=True,
    )
    service_rating = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="service rating",
        db_column="service_rating",
        null=True,
        blank=True,
    )
    overall_rating = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="overall rating",
        db_column="overall_rating",
        null=True,
        blank=True,
    )
    would_return = models.BooleanField(
        default=True, verbose_name="would return", db_column="would_return"
    )
    general_notes = models.TextField(
        blank=True, verbose_name="general notes", db_column="general_notes"
    )
    photo = models.ImageField(
        upload_to="visits/photos/",
        blank=True,
        null=True,
        verbose_name="photo",
        db_column="photo",
    )
    photo_path = models.CharField(
        max_length=500, blank=True, verbose_name="photo path", db_column="photo_path"
    )

    class Meta:
        db_table = "places_visit"
        ordering = ("-visited_at",)
        verbose_name = "visit"
        verbose_name_plural = "visits"

    def __str__(self) -> str:
        return f"{self.place.name} @ {self.visited_at:%Y-%m-%d}"


class VisitItem(TimeStampedModel):
    objects = VisitItemQuerySet.as_manager()

    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="visit",
        db_column="visit_id",
    )
    name = models.CharField(max_length=200, verbose_name="name", db_column="name")
    type = models.CharField(
        max_length=32,
        choices=VisitItemType.choices,
        default=VisitItemType.OTHER,
        verbose_name="type",
        db_column="type",
    )
    rating = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="rating",
        db_column="rating",
        null=True,
        blank=True,
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="price",
        db_column="price",
        null=True,
        blank=True,
    )
    would_order_again = models.BooleanField(
        default=True, verbose_name="would order again", db_column="would_order_again"
    )
    notes = models.TextField(blank=True, verbose_name="notes", db_column="notes")
    photo = models.ImageField(
        upload_to="visit_items/photos/",
        blank=True,
        null=True,
        verbose_name="photo",
        db_column="photo",
    )
    photo_path = models.CharField(
        max_length=500, blank=True, verbose_name="photo path", db_column="photo_path"
    )

    class Meta:
        db_table = "places_visit_item"
        ordering = ("-created_at",)
        verbose_name = "visit item"
        verbose_name_plural = "visit items"

    def __str__(self) -> str:
        return self.name
