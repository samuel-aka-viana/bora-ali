# Backend: Models

## core/models.py — PublicIdModel

```python
import uuid
from django.db import models

class PublicIdModel(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    class Meta:
        abstract = True
```

**Regra**: Nunca expor PKs internas em endpoints. ViewSets usam `lookup_field = "public_id"`.

**Migration segura**: adicionar nullable → `RunPython` para popular → `AlterField` unique+non-null.

## places/models.py

```python
import uuid
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from core.models import PublicIdModel


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True


class PlaceStatus(models.TextChoices):
    WANT_TO_VISIT = "want_to_visit", "Quero conhecer"
    VISITED = "visited", "Visitado"
    FAVORITE = "favorite", "Favorito"
    WOULD_NOT_RETURN = "would_not_return", "Não voltaria"


class VisitItemType(models.TextChoices):
    SWEET = "sweet", "Doce"
    SAVORY = "savory", "Salgado"
    DRINK = "drink", "Bebida"
    COFFEE = "coffee", "Café"
    JUICE = "juice", "Suco"
    DESSERT = "dessert", "Sobremesa"
    OTHER = "other", "Outro"


class Place(PublicIdModel, TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="places", on_delete=models.CASCADE)
    name = models.CharField(max_length=160)
    category = models.CharField(max_length=80, blank=True)
    address = models.CharField(max_length=255, blank=True)
    instagram_url = models.URLField(max_length=255, blank=True)
    maps_url = models.URLField(max_length=500, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=PlaceStatus.choices, default=PlaceStatus.WANT_TO_VISIT)
    notes = models.TextField(blank=True)
    cover_photo = models.CharField(max_length=500, blank=True)  # path in storage

    class Meta:
        db_table = "places"
        ordering = ["-updated_at"]


class Visit(PublicIdModel, TimeStampedModel):
    place = models.ForeignKey(Place, related_name="visits", on_delete=models.CASCADE)
    visited_at = models.DateTimeField()
    environment_rating = models.PositiveSmallIntegerField(null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)])
    service_rating = models.PositiveSmallIntegerField(null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)])
    overall_rating = models.PositiveSmallIntegerField(null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)])
    would_return = models.BooleanField(null=True, blank=True)
    general_notes = models.TextField(blank=True)
    photo = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "visits"
        ordering = ["-visited_at", "-created_at"]


class VisitItem(PublicIdModel, TimeStampedModel):
    visit = models.ForeignKey(Visit, related_name="items", on_delete=models.CASCADE)
    name = models.CharField(max_length=160)
    type = models.CharField(max_length=30, choices=VisitItemType.choices, default=VisitItemType.OTHER)
    rating = models.PositiveSmallIntegerField(null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)])
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    would_order_again = models.BooleanField(null=True, blank=True)
    notes = models.TextField(blank=True)
    photo = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "visit_items"
        ordering = ["created_at"]
```

## accounts/models.py — UserSession + UserProfile

```python
import uuid
from django.conf import settings
from django.db import models

class UserSession(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="session")
    session_key = models.UUIDField(default=uuid.uuid4)
    updated_at = models.DateTimeField(auto_now=True)

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    profile_photo = models.CharField(max_length=500, blank=True)
    is_google_account = models.BooleanField(default=False)
```
