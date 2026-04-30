# Bora Ali MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Bora Ali MVP — a personal place diary with auth, place/visit/item CRUD, ratings, filtering, and pagination.

**Architecture:** Django REST API (backend/) + React SPA (frontend/) + PostgreSQL (Docker). Each layer is independent; the API is the contract between them.

**Tech Stack:** Python/Django/DRF/SimpleJWT/PostgreSQL | React/Vite/TypeScript/Tailwind/Axios

---

## Task 1: Project scaffolding

- [ ] Create root directories:
  ```bash
  mkdir -p backend frontend
  ```
- [ ] Create `docker-compose.yml`:
  ```yaml
  version: "3.9"
  services:
    db:
      image: postgres:16
      restart: unless-stopped
      environment:
        POSTGRES_DB: bora_ali
        POSTGRES_USER: bora
        POSTGRES_PASSWORD: bora
      ports:
        - "5432:5432"
      volumes:
        - bora_ali_pgdata:/var/lib/postgresql/data
  volumes:
    bora_ali_pgdata:
  ```
- [ ] Start PostgreSQL: `docker compose up -d db`. Expected: `Container ... Started`.
- [ ] Create Python venv:
  ```bash
  cd backend && python -m venv .venv && source .venv/bin/activate
  ```
- [ ] Create `backend/requirements.txt`:
  ```
  Django==5.0.6
  djangorestframework==3.15.1
  djangorestframework-simplejwt==5.3.1
  psycopg[binary]==3.1.19
  django-filter==24.2
  django-cors-headers==4.3.1
  drf-spectacular==0.27.2
  python-dotenv==1.0.1
  pytest==8.2.0
  pytest-django==4.8.0
  factory-boy==3.3.0
  model-bakery==1.18.0
  black==24.4.2
  isort==5.13.2
  flake8==7.0.0
  ```
- [ ] Install: `pip install -r requirements.txt`. Expected: `Successfully installed ...`.
- [ ] Bootstrap project: `django-admin startproject config .`
- [ ] Create apps: `python manage.py startapp accounts && python manage.py startapp places`
- [ ] Create `backend/.env.example`:
  ```
  DJANGO_SECRET_KEY=changeme
  DJANGO_DEBUG=True
  DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
  POSTGRES_DB=bora_ali
  POSTGRES_USER=bora
  POSTGRES_PASSWORD=bora
  POSTGRES_HOST=localhost
  POSTGRES_PORT=5432
  CORS_ALLOWED_ORIGINS=http://localhost:5173
  ```
- [ ] Copy: `cp .env.example .env`.
- [ ] Create `backend/pytest.ini`:
  ```ini
  [pytest]
  DJANGO_SETTINGS_MODULE = config.settings
  python_files = tests.py test_*.py *_tests.py
  addopts = -ra
  ```
- [ ] Create `backend/.gitignore`:
  ```
  .venv/
  __pycache__/
  *.pyc
  .env
  db.sqlite3
  ```
- [ ] Commit:
  ```bash
  git init && git add -A && git commit -m "chore: scaffold backend, docker, and tooling"
  ```

---

## Task 2: Django settings

- [ ] Replace `backend/config/settings.py` top with env loader:
  ```python
  from pathlib import Path
  import os
  from datetime import timedelta
  from dotenv import load_dotenv

  BASE_DIR = Path(__file__).resolve().parent.parent
  load_dotenv(BASE_DIR / ".env")

  SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret")
  DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"
  ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")
  ```
- [ ] Set `INSTALLED_APPS`:
  ```python
  INSTALLED_APPS = [
      "django.contrib.admin",
      "django.contrib.auth",
      "django.contrib.contenttypes",
      "django.contrib.sessions",
      "django.contrib.messages",
      "django.contrib.staticfiles",
      "rest_framework",
      "rest_framework_simplejwt",
      "rest_framework_simplejwt.token_blacklist",
      "django_filters",
      "corsheaders",
      "drf_spectacular",
      "accounts",
      "places",
  ]
  ```
- [ ] Set `MIDDLEWARE` (corsheaders must be first):
  ```python
  MIDDLEWARE = [
      "corsheaders.middleware.CorsMiddleware",
      "django.middleware.security.SecurityMiddleware",
      "django.contrib.sessions.middleware.SessionMiddleware",
      "django.middleware.common.CommonMiddleware",
      "django.middleware.csrf.CsrfViewMiddleware",
      "django.contrib.auth.middleware.AuthenticationMiddleware",
      "django.contrib.messages.middleware.MessageMiddleware",
      "django.middleware.clickjacking.XFrameOptionsMiddleware",
  ]
  ```
- [ ] Configure `DATABASES`:
  ```python
  DATABASES = {
      "default": {
          "ENGINE": "django.db.backends.postgresql",
          "NAME": os.getenv("POSTGRES_DB"),
          "USER": os.getenv("POSTGRES_USER"),
          "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
          "HOST": os.getenv("POSTGRES_HOST", "localhost"),
          "PORT": os.getenv("POSTGRES_PORT", "5432"),
      }
  }
  ```
- [ ] Append REST + JWT + CORS config:
  ```python
  REST_FRAMEWORK = {
      "DEFAULT_AUTHENTICATION_CLASSES": (
          "rest_framework_simplejwt.authentication.JWTAuthentication",
      ),
      "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
      "DEFAULT_FILTER_BACKENDS": (
          "django_filters.rest_framework.DjangoFilterBackend",
          "rest_framework.filters.SearchFilter",
          "rest_framework.filters.OrderingFilter",
      ),
      "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
      "PAGE_SIZE": 20,
      "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
      "DEFAULT_THROTTLE_CLASSES": (
          "rest_framework.throttling.AnonRateThrottle",
          "rest_framework.throttling.UserRateThrottle",
          "rest_framework.throttling.ScopedRateThrottle",
      ),
      "DEFAULT_THROTTLE_RATES": {
          "anon": "100/hour",
          "user": "1000/hour",
          "auth": "10/minute",
      },
  }

  SIMPLE_JWT = {
      "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
      "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
      "ROTATE_REFRESH_TOKENS": True,
      "BLACKLIST_AFTER_ROTATION": True,
      "AUTH_HEADER_TYPES": ("Bearer",),
  }

  SPECTACULAR_SETTINGS = {
      "TITLE": "Bora Ali API",
      "VERSION": "0.1.0",
      "SERVE_INCLUDE_SCHEMA": False,
  }

  CORS_ALLOWED_ORIGINS = os.getenv(
      "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
  ).split(",")
  ```
- [ ] Run: `python manage.py check`. Expected: `System check identified no issues (0 silenced).`
- [ ] Commit: `git add -A && git commit -m "chore: configure Django settings, JWT, CORS, throttles"`

---

## Task 3: Models (places app)

- [ ] Create `backend/places/models.py`:
  ```python
  from django.conf import settings
  from django.core.validators import MinValueValidator, MaxValueValidator
  from django.db import models


  class TimeStampedModel(models.Model):
      created_at = models.DateTimeField(auto_now_add=True, verbose_name="created at", db_column="created_at")
      updated_at = models.DateTimeField(auto_now=True, verbose_name="updated at", db_column="updated_at")

      class Meta:
          abstract = True


  class PlaceStatus(models.TextChoices):
      WANT_TO_VISIT = "want_to_visit", "Want to visit"
      VISITED = "visited", "Visited"
      FAVORITE = "favorite", "Favorite"
      WOULD_NOT_RETURN = "would_not_return", "Would not return"


  class VisitItemType(models.TextChoices):
      SWEET = "sweet", "Sweet"
      SAVORY = "savory", "Savory"
      DRINK = "drink", "Drink"
      COFFEE = "coffee", "Coffee"
      JUICE = "juice", "Juice"
      DESSERT = "dessert", "Dessert"
      OTHER = "other", "Other"


  class Place(TimeStampedModel):
      user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="places", verbose_name="user", db_column="user_id")
      name = models.CharField(max_length=200, verbose_name="name", db_column="name")
      category = models.CharField(max_length=100, verbose_name="category", db_column="category")
      address = models.CharField(max_length=300, blank=True, verbose_name="address", db_column="address")
      instagram_url = models.URLField(blank=True, verbose_name="instagram url", db_column="instagram_url")
      maps_url = models.URLField(blank=True, verbose_name="maps url", db_column="maps_url")
      status = models.CharField(max_length=32, choices=PlaceStatus.choices, default=PlaceStatus.WANT_TO_VISIT, verbose_name="status", db_column="status")
      notes = models.TextField(blank=True, verbose_name="notes", db_column="notes")
      cover_photo_path = models.CharField(max_length=500, blank=True, verbose_name="cover photo path", db_column="cover_photo_path")

      class Meta:
          db_table = "places_place"
          ordering = ("-created_at",)
          verbose_name = "place"
          verbose_name_plural = "places"

      def __str__(self) -> str:
          return self.name


  class Visit(TimeStampedModel):
      place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="visits", verbose_name="place", db_column="place_id")
      visited_at = models.DateTimeField(verbose_name="visited at", db_column="visited_at")
      environment_rating = models.DecimalField(max_digits=4, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(10)], verbose_name="environment rating", db_column="environment_rating")
      service_rating = models.DecimalField(max_digits=4, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(10)], verbose_name="service rating", db_column="service_rating")
      overall_rating = models.DecimalField(max_digits=4, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(10)], verbose_name="overall rating", db_column="overall_rating")
      would_return = models.BooleanField(default=True, verbose_name="would return", db_column="would_return")
      general_notes = models.TextField(blank=True, verbose_name="general notes", db_column="general_notes")
      photo_path = models.CharField(max_length=500, blank=True, verbose_name="photo path", db_column="photo_path")

      class Meta:
          db_table = "places_visit"
          ordering = ("-visited_at",)
          verbose_name = "visit"
          verbose_name_plural = "visits"

      def __str__(self) -> str:
          return f"{self.place.name} @ {self.visited_at:%Y-%m-%d}"


  class VisitItem(TimeStampedModel):
      visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name="items", verbose_name="visit", db_column="visit_id")
      name = models.CharField(max_length=200, verbose_name="name", db_column="name")
      type = models.CharField(max_length=32, choices=VisitItemType.choices, default=VisitItemType.OTHER, verbose_name="type", db_column="type")
      rating = models.DecimalField(max_digits=4, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(10)], verbose_name="rating", db_column="rating")
      price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="price", db_column="price")
      would_order_again = models.BooleanField(default=True, verbose_name="would order again", db_column="would_order_again")
      notes = models.TextField(blank=True, verbose_name="notes", db_column="notes")
      photo_path = models.CharField(max_length=500, blank=True, verbose_name="photo path", db_column="photo_path")

      class Meta:
          db_table = "places_visit_item"
          ordering = ("-created_at",)
          verbose_name = "visit item"
          verbose_name_plural = "visit items"

      def __str__(self) -> str:
          return self.name
  ```
- [ ] Run: `python manage.py makemigrations places`. Expected: `Migrations for 'places': ...`
- [ ] Run: `python manage.py migrate`. Expected: `Applying ... OK`.
- [ ] Commit: `git add -A && git commit -m "feat(places): add Place, Visit, VisitItem models"`

---

## Task 4: accounts app (auth)

- [ ] Create `backend/accounts/serializers.py`:
  ```python
  from django.contrib.auth import get_user_model
  from django.contrib.auth.password_validation import validate_password
  from rest_framework import serializers

  User = get_user_model()


  class RegisterSerializer(serializers.ModelSerializer):
      password = serializers.CharField(write_only=True, validators=[validate_password])
      confirm_password = serializers.CharField(write_only=True)

      class Meta:
          model = User
          fields = ("id", "username", "email", "password", "confirm_password")

      def validate(self, attrs):
          if attrs["password"] != attrs.pop("confirm_password"):
              raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
          return attrs

      def create(self, validated_data):
          return User.objects.create_user(**validated_data)


  class UserSerializer(serializers.ModelSerializer):
      class Meta:
          model = User
          fields = ("id", "username", "email")
          read_only_fields = fields
  ```
- [ ] Create `backend/accounts/throttles.py`:
  ```python
  from rest_framework.throttling import ScopedRateThrottle

  class AuthRateThrottle(ScopedRateThrottle):
      scope = "auth"
  ```
- [ ] Create `backend/accounts/views.py`:
  ```python
  from rest_framework import generics, permissions, status
  from rest_framework.response import Response
  from rest_framework.views import APIView
  from rest_framework_simplejwt.tokens import RefreshToken
  from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

  from .serializers import RegisterSerializer, UserSerializer
  from .throttles import AuthRateThrottle


  class RegisterView(generics.CreateAPIView):
      serializer_class = RegisterSerializer
      permission_classes = [permissions.AllowAny]
      throttle_classes = [AuthRateThrottle]
      throttle_scope = "auth"


  class ThrottledLoginView(TokenObtainPairView):
      throttle_classes = [AuthRateThrottle]
      throttle_scope = "auth"


  class ThrottledRefreshView(TokenRefreshView):
      throttle_classes = [AuthRateThrottle]
      throttle_scope = "auth"


  class LogoutView(APIView):
      permission_classes = [permissions.IsAuthenticated]

      def post(self, request):
          try:
              RefreshToken(request.data["refresh"]).blacklist()
          except Exception:
              return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)
          return Response(status=status.HTTP_205_RESET_CONTENT)


  class MeView(generics.RetrieveAPIView):
      serializer_class = UserSerializer

      def get_object(self):
          return self.request.user
  ```
- [ ] Create `backend/accounts/urls.py`:
  ```python
  from django.urls import path
  from .views import RegisterView, ThrottledLoginView, ThrottledRefreshView, LogoutView, MeView

  urlpatterns = [
      path("register/", RegisterView.as_view()),
      path("login/", ThrottledLoginView.as_view()),
      path("refresh/", ThrottledRefreshView.as_view()),
      path("logout/", LogoutView.as_view()),
      path("me/", MeView.as_view()),
  ]
  ```
- [ ] Wire `backend/config/urls.py`:
  ```python
  from django.contrib import admin
  from django.urls import include, path
  from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

  urlpatterns = [
      path("admin/", admin.site.urls),
      path("api/auth/", include("accounts.urls")),
      path("api/", include("places.urls")),
      path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
      path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
  ]
  ```
- [ ] Commit: `git add -A && git commit -m "feat(accounts): JWT auth endpoints with rate limiting"`

---

## Task 5: Places serializers

- [ ] Create `backend/places/serializers.py`:
  ```python
  from rest_framework import serializers
  from .models import Place, Visit, VisitItem


  class VisitItemSerializer(serializers.ModelSerializer):
      class Meta:
          model = VisitItem
          fields = ("id", "visit", "name", "type", "rating", "price",
                    "would_order_again", "notes", "photo_path",
                    "created_at", "updated_at")
          read_only_fields = ("id", "visit", "created_at", "updated_at")


  class VisitItemWriteSerializer(serializers.ModelSerializer):
      class Meta:
          model = VisitItem
          fields = ("name", "type", "rating", "price",
                    "would_order_again", "notes", "photo_path")


  class VisitSerializer(serializers.ModelSerializer):
      items = VisitItemSerializer(many=True, read_only=True)

      class Meta:
          model = Visit
          fields = ("id", "place", "visited_at", "environment_rating",
                    "service_rating", "overall_rating", "would_return",
                    "general_notes", "photo_path", "items",
                    "created_at", "updated_at")
          read_only_fields = ("id", "place", "items", "created_at", "updated_at")


  class VisitWriteSerializer(serializers.ModelSerializer):
      class Meta:
          model = Visit
          fields = ("visited_at", "environment_rating", "service_rating",
                    "overall_rating", "would_return", "general_notes", "photo_path")


  class PlaceListSerializer(serializers.ModelSerializer):
      class Meta:
          model = Place
          fields = ("id", "name", "category", "address", "status",
                    "cover_photo_path", "created_at", "updated_at")


  class PlaceDetailSerializer(serializers.ModelSerializer):
      visits = VisitSerializer(many=True, read_only=True)

      class Meta:
          model = Place
          fields = ("id", "name", "category", "address", "instagram_url",
                    "maps_url", "status", "notes", "cover_photo_path",
                    "visits", "created_at", "updated_at")


  class PlaceWriteSerializer(serializers.ModelSerializer):
      class Meta:
          model = Place
          fields = ("name", "category", "address", "instagram_url",
                    "maps_url", "status", "notes", "cover_photo_path")

      def create(self, validated_data):
          validated_data["user"] = self.context["request"].user
          return super().create(validated_data)
  ```
- [ ] Commit: `git add -A && git commit -m "feat(places): add serializers"`

---

## Task 6: Places filters

- [ ] Create `backend/places/filters.py`:
  ```python
  import django_filters
  from .models import Place, Visit, VisitItem


  class PlaceFilter(django_filters.FilterSet):
      class Meta:
          model = Place
          fields = {"status": ["exact"], "category": ["exact", "icontains"]}


  class VisitFilter(django_filters.FilterSet):
      class Meta:
          model = Visit
          fields = {
              "visited_at": ["gte", "lte"],
              "would_return": ["exact"],
              "overall_rating": ["gte", "lte"],
          }


  class VisitItemFilter(django_filters.FilterSet):
      class Meta:
          model = VisitItem
          fields = {
              "type": ["exact"],
              "rating": ["gte", "lte"],
              "would_order_again": ["exact"],
          }
  ```
- [ ] Commit: `git add -A && git commit -m "feat(places): add filtersets"`

---

## Task 7: Places viewsets + urls

- [ ] Create `backend/places/views.py`:
  ```python
  from rest_framework import mixins, status, viewsets
  from rest_framework.decorators import action
  from rest_framework.response import Response
  from rest_framework.generics import get_object_or_404

  from .filters import PlaceFilter, VisitFilter, VisitItemFilter
  from .models import Place, Visit, VisitItem
  from .serializers import (
      PlaceDetailSerializer, PlaceListSerializer, PlaceWriteSerializer,
      VisitItemSerializer, VisitItemWriteSerializer, VisitSerializer, VisitWriteSerializer,
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
  ```
- [ ] Create `backend/places/urls.py`:
  ```python
  from rest_framework.routers import DefaultRouter
  from .views import PlaceViewSet, VisitViewSet, VisitItemViewSet

  router = DefaultRouter()
  router.register(r"places", PlaceViewSet, basename="place")
  router.register(r"visits", VisitViewSet, basename="visit")
  router.register(r"visit-items", VisitItemViewSet, basename="visit-item")

  urlpatterns = router.urls
  ```
- [ ] Run: `python manage.py runserver` then visit `http://localhost:8000/api/docs/`. Expected: Swagger UI rendered.
- [ ] Commit: `git add -A && git commit -m "feat(places): viewsets, routers, swagger docs"`

---

## Task 8: Django admin

- [ ] Create `backend/places/admin.py`:
  ```python
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
  ```
- [ ] Run: `python manage.py createsuperuser` (interactive).
- [ ] Commit: `git add -A && git commit -m "feat(places): register admin"`

---

## Task 9: Backend tests

- [ ] Create `backend/conftest.py`:
  ```python
  import pytest
  from django.contrib.auth import get_user_model
  from rest_framework.test import APIClient

  User = get_user_model()


  @pytest.fixture
  def user(db):
      return User.objects.create_user(username="alice", email="a@a.com", password="pw12345!")


  @pytest.fixture
  def other_user(db):
      return User.objects.create_user(username="bob", email="b@b.com", password="pw12345!")


  @pytest.fixture
  def api_client():
      return APIClient()


  @pytest.fixture
  def auth_client(api_client, user):
      api_client.force_authenticate(user)
      return api_client
  ```
- [ ] Create `backend/accounts/tests/test_auth.py`:
  ```python
  import pytest

  pytestmark = pytest.mark.django_db


  def test_register(api_client):
      r = api_client.post("/api/auth/register/", {
          "username": "carol", "email": "c@c.com",
          "password": "Strong-Pass1!", "confirm_password": "Strong-Pass1!",
      }, format="json")
      assert r.status_code == 201

  def test_login_returns_tokens(api_client, user):
      r = api_client.post("/api/auth/login/", {"username": "alice", "password": "pw12345!"}, format="json")
      assert r.status_code == 200 and "access" in r.data and "refresh" in r.data

  def test_refresh(api_client, user):
      tokens = api_client.post("/api/auth/login/", {"username": "alice", "password": "pw12345!"}, format="json").data
      r = api_client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
      assert r.status_code == 200 and "access" in r.data

  def test_logout_blacklists(api_client, user):
      tokens = api_client.post("/api/auth/login/", {"username": "alice", "password": "pw12345!"}, format="json").data
      api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
      r = api_client.post("/api/auth/logout/", {"refresh": tokens["refresh"]}, format="json")
      assert r.status_code == 205
      r2 = api_client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
      assert r2.status_code == 401

  def test_me(auth_client):
      r = auth_client.get("/api/auth/me/")
      assert r.status_code == 200 and r.data["username"] == "alice"

  def test_unauth_blocked(api_client):
      assert api_client.get("/api/auth/me/").status_code == 401
  ```
- [ ] Create `backend/places/tests/test_places.py`:
  ```python
  import pytest
  from model_bakery import baker

  pytestmark = pytest.mark.django_db


  def test_create_place(auth_client):
      r = auth_client.post("/api/places/", {"name": "Café X", "category": "café", "status": "want_to_visit"}, format="json")
      assert r.status_code == 201

  def test_list_only_own(auth_client, user, other_user):
      baker.make("places.Place", user=user, _quantity=2)
      baker.make("places.Place", user=other_user, _quantity=3)
      r = auth_client.get("/api/places/")
      assert r.status_code == 200 and r.data["count"] == 2

  def test_cannot_access_others_place(auth_client, other_user):
      p = baker.make("places.Place", user=other_user)
      assert auth_client.get(f"/api/places/{p.id}/").status_code == 404

  def test_filter_by_status(auth_client, user):
      baker.make("places.Place", user=user, status="favorite")
      baker.make("places.Place", user=user, status="visited")
      r = auth_client.get("/api/places/?status=favorite")
      assert r.data["count"] == 1

  def test_search_by_name(auth_client, user):
      baker.make("places.Place", user=user, name="Padaria Bom Pão")
      baker.make("places.Place", user=user, name="Outro")
      r = auth_client.get("/api/places/?search=Padaria")
      assert r.data["count"] == 1

  def test_pagination(auth_client, user):
      baker.make("places.Place", user=user, _quantity=25)
      r = auth_client.get("/api/places/")
      assert r.data["count"] == 25 and len(r.data["results"]) == 20
  ```
- [ ] Create `backend/places/tests/test_visits.py`:
  ```python
  import pytest
  from model_bakery import baker

  pytestmark = pytest.mark.django_db

  PAYLOAD = {
      "visited_at": "2026-04-29T12:00:00Z",
      "environment_rating": 8, "service_rating": 9, "overall_rating": 9,
      "would_return": True, "general_notes": "ok",
  }


  def test_create_visit_in_own_place(auth_client, user):
      p = baker.make("places.Place", user=user)
      r = auth_client.post(f"/api/places/{p.id}/visits/", PAYLOAD, format="json")
      assert r.status_code == 201

  def test_reject_foreign_place(auth_client, other_user):
      p = baker.make("places.Place", user=other_user)
      r = auth_client.post(f"/api/places/{p.id}/visits/", PAYLOAD, format="json")
      assert r.status_code == 404

  def test_rating_out_of_range(auth_client, user):
      p = baker.make("places.Place", user=user)
      bad = {**PAYLOAD, "overall_rating": 11}
      assert auth_client.post(f"/api/places/{p.id}/visits/", bad, format="json").status_code == 400

  def test_negative_rating(auth_client, user):
      p = baker.make("places.Place", user=user)
      bad = {**PAYLOAD, "environment_rating": -1}
      assert auth_client.post(f"/api/places/{p.id}/visits/", bad, format="json").status_code == 400
  ```
- [ ] Create `backend/places/tests/test_visit_items.py`:
  ```python
  import pytest
  from model_bakery import baker

  pytestmark = pytest.mark.django_db

  PAYLOAD = {"name": "Espresso", "type": "coffee", "rating": 9, "price": "12.50", "would_order_again": True}


  def test_create_in_own_visit(auth_client, user):
      v = baker.make("places.Visit", place__user=user)
      r = auth_client.post(f"/api/visits/{v.id}/items/", PAYLOAD, format="json")
      assert r.status_code == 201

  def test_reject_foreign_visit(auth_client, other_user):
      v = baker.make("places.Visit", place__user=other_user)
      assert auth_client.post(f"/api/visits/{v.id}/items/", PAYLOAD, format="json").status_code == 404

  def test_negative_price_rejected(auth_client, user):
      v = baker.make("places.Visit", place__user=user)
      bad = {**PAYLOAD, "price": "-1.00"}
      assert auth_client.post(f"/api/visits/{v.id}/items/", bad, format="json").status_code == 400

  def test_rating_out_of_range(auth_client, user):
      v = baker.make("places.Visit", place__user=user)
      bad = {**PAYLOAD, "rating": 11}
      assert auth_client.post(f"/api/visits/{v.id}/items/", bad, format="json").status_code == 400
  ```
- [ ] Add empty `__init__.py` files: `touch backend/accounts/tests/__init__.py backend/places/tests/__init__.py`
- [ ] Run: `cd backend && pytest`. Expected: all tests pass.
- [ ] Commit: `git add -A && git commit -m "test(backend): auth, places, visits, items coverage"`

---

## Task 10: Frontend scaffold

- [ ] From repo root:
  ```bash
  cd frontend
  npm create vite@latest . -- --template react-ts
  npm install
  npm install react-router-dom axios
  npm install -D tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/node
  npx tailwindcss init -p
  ```
- [ ] Replace `frontend/tailwind.config.js` (rename to `.ts`) with:
  ```ts
  import type { Config } from "tailwindcss";
  export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
      extend: {
        colors: {
          primary: "#EA1D2C",
          "primary-dark": "#B91422",
          background: "#FAFAFA",
          surface: "#FFFFFF",
          text: "#1F2937",
          muted: "#6B7280",
          border: "#E5E7EB",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
        },
      },
    },
    plugins: [],
  } satisfies Config;
  ```
- [ ] Replace `frontend/src/index.css`:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  body { @apply bg-background text-text; }
  ```
- [ ] Update `frontend/vite.config.ts`:
  ```ts
  /// <reference types="vitest" />
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";

  export default defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  });
  ```
- [ ] Create `frontend/src/test/setup.ts`:
  ```ts
  import "@testing-library/jest-dom";
  ```
- [ ] Create `frontend/.env.example`:
  ```
  VITE_API_URL=http://localhost:8000/api
  ```
- [ ] Copy `cp .env.example .env`.
- [ ] Add scripts in `frontend/package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest"
  ```
- [ ] Commit: `git add -A && git commit -m "chore(frontend): scaffold Vite+React+TS+Tailwind+Vitest"`

---

## Task 11: Types, constants, API client

- [ ] Create `frontend/src/types/user.ts`:
  ```ts
  export interface User { id: number; username: string; email: string; }
  ```
- [ ] Create `frontend/src/types/place.ts`:
  ```ts
  export type PlaceStatus = "want_to_visit" | "visited" | "favorite" | "would_not_return";

  export interface Place {
    id: number;
    name: string;
    category: string;
    address: string;
    instagram_url?: string;
    maps_url?: string;
    status: PlaceStatus;
    notes?: string;
    cover_photo_path?: string;
    created_at: string;
    updated_at: string;
  }
  ```
- [ ] Create `frontend/src/types/visit.ts`:
  ```ts
  import type { VisitItem } from "./visit-item";

  export interface Visit {
    id: number;
    place: number;
    visited_at: string;
    environment_rating: number;
    service_rating: number;
    overall_rating: number;
    would_return: boolean;
    general_notes?: string;
    photo_path?: string;
    items: VisitItem[];
    created_at: string;
    updated_at: string;
  }
  ```
- [ ] Create `frontend/src/types/visit-item.ts`:
  ```ts
  export type VisitItemType = "sweet" | "savory" | "drink" | "coffee" | "juice" | "dessert" | "other";

  export interface VisitItem {
    id: number;
    visit: number;
    name: string;
    type: VisitItemType;
    rating: number;
    price: string;
    would_order_again: boolean;
    notes?: string;
    photo_path?: string;
    created_at: string;
    updated_at: string;
  }
  ```
- [ ] Create `frontend/src/utils/constants.ts`:
  ```ts
  export const PLACE_STATUSES = [
    { value: "want_to_visit", label: "Want to visit" },
    { value: "visited", label: "Visited" },
    { value: "favorite", label: "Favorite" },
    { value: "would_not_return", label: "Would not return" },
  ] as const;

  export const VISIT_ITEM_TYPES = [
    { value: "sweet", label: "Sweet" },
    { value: "savory", label: "Savory" },
    { value: "drink", label: "Drink" },
    { value: "coffee", label: "Coffee" },
    { value: "juice", label: "Juice" },
    { value: "dessert", label: "Dessert" },
    { value: "other", label: "Other" },
  ] as const;

  export const ACCESS_KEY = "boraali_access";
  export const REFRESH_KEY = "boraali_refresh";
  ```
- [ ] Create `frontend/src/utils/formatters.ts`:
  ```ts
  export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();
  export const fmtRating = (n: number) => n.toFixed(1);
  export const fmtPrice = (p: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p));
  ```
- [ ] Create `frontend/src/services/api.ts`:
  ```ts
  import axios from "axios";
  import { ACCESS_KEY, REFRESH_KEY } from "../utils/constants";

  export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  let refreshing: Promise<string> | null = null;

  api.interceptors.response.use(
    (r) => r,
    async (error) => {
      const original = error.config;
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (!refresh) {
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }
        try {
          refreshing = refreshing ?? axios
            .post(`${import.meta.env.VITE_API_URL}/auth/refresh/`, { refresh })
            .then((r) => {
              localStorage.setItem(ACCESS_KEY, r.data.access);
              return r.data.access as string;
            });
          const access = await refreshing;
          refreshing = null;
          original.headers.Authorization = `Bearer ${access}`;
          return api(original);
        } catch (e) {
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(e);
        }
      }
      return Promise.reject(error);
    }
  );
  ```
- [ ] Commit: `git add -A && git commit -m "feat(frontend): types, constants, axios client with refresh"`

---

## Task 12: Auth service + context

- [ ] Create `frontend/src/services/auth.service.ts`:
  ```ts
  import { api } from "./api";
  import { ACCESS_KEY, REFRESH_KEY } from "../utils/constants";
  import type { User } from "../types/user";

  export const authService = {
    async register(data: { username: string; email: string; password: string; confirm_password: string }) {
      return api.post("/auth/register/", data);
    },
    async login(username: string, password: string) {
      const { data } = await api.post("/auth/login/", { username, password });
      localStorage.setItem(ACCESS_KEY, data.access);
      localStorage.setItem(REFRESH_KEY, data.refresh);
      return data;
    },
    async logout() {
      const refresh = localStorage.getItem(REFRESH_KEY);
      try { await api.post("/auth/logout/", { refresh }); } catch {}
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    },
    async me(): Promise<User> {
      const { data } = await api.get<User>("/auth/me/");
      return data;
    },
  };
  ```
- [ ] Create `frontend/src/contexts/AuthContext.tsx`:
  ```tsx
  import { createContext, useContext, useEffect, useState, ReactNode } from "react";
  import { authService } from "../services/auth.service";
  import { ACCESS_KEY } from "../utils/constants";
  import type { User } from "../types/user";

  interface Ctx {
    user: User | null;
    loading: boolean;
    login: (u: string, p: string) => Promise<void>;
    logout: () => Promise<void>;
  }

  const AuthCtx = createContext<Ctx | null>(null);

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!localStorage.getItem(ACCESS_KEY)) { setLoading(false); return; }
      authService.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const login = async (u: string, p: string) => { await authService.login(u, p); setUser(await authService.me()); };
    const logout = async () => { await authService.logout(); setUser(null); };

    return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
  }

  export const useAuth = () => {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth outside provider");
    return ctx;
  };
  ```
- [ ] Commit: `git add -A && git commit -m "feat(frontend): auth service and context"`

---

## Task 13: UI components

- [ ] Create `frontend/src/components/ui/Button.tsx`:
  ```tsx
  import { ButtonHTMLAttributes } from "react";
  type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
  };
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-surface text-text border border-border hover:bg-background",
    danger: "bg-danger text-white hover:opacity-90",
  };
  const sizes = { sm: "px-3 py-1 text-sm", md: "px-4 py-2", lg: "px-6 py-3 text-lg" };
  export function Button({ variant = "primary", size = "md", className = "", ...rest }: Props) {
    return <button {...rest} className={`rounded-xl font-medium shadow-sm ${variants[variant]} ${sizes[size]} ${className}`} />;
  }
  ```
- [ ] Create `frontend/src/components/ui/Input.tsx`:
  ```tsx
  import { InputHTMLAttributes } from "react";
  type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };
  export function Input({ label, error, ...rest }: Props) {
    return (
      <label className="block">
        {label && <span className="block text-sm font-medium mb-1">{label}</span>}
        <input {...rest} className="w-full rounded-xl border border-border px-3 py-2 focus:outline-primary" />
        {error && <span className="text-danger text-xs">{error}</span>}
      </label>
    );
  }
  ```
- [ ] Create `frontend/src/components/ui/Textarea.tsx`:
  ```tsx
  import { TextareaHTMLAttributes } from "react";
  export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
    const { label, ...rest } = props;
    return (
      <label className="block">
        {label && <span className="block text-sm font-medium mb-1">{label}</span>}
        <textarea {...rest} className="w-full rounded-xl border border-border px-3 py-2 min-h-[80px]" />
      </label>
    );
  }
  ```
- [ ] Create `frontend/src/components/ui/Select.tsx`:
  ```tsx
  import { SelectHTMLAttributes } from "react";
  export function Select({ label, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
    return (
      <label className="block">
        {label && <span className="block text-sm font-medium mb-1">{label}</span>}
        <select {...rest} className="w-full rounded-xl border border-border px-3 py-2 bg-surface">{children}</select>
      </label>
    );
  }
  ```
- [ ] Create `frontend/src/components/ui/Card.tsx`:
  ```tsx
  import { HTMLAttributes } from "react";
  export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
    return <div {...rest} className={`bg-surface rounded-2xl shadow-sm border border-border p-4 ${className}`} />;
  }
  ```
- [ ] Create `frontend/src/components/ui/Badge.tsx`:
  ```tsx
  import type { PlaceStatus } from "../../types/place";
  const map: Record<PlaceStatus, string> = {
    want_to_visit: "bg-warning/20 text-warning",
    visited: "bg-success/20 text-success",
    favorite: "bg-primary/20 text-primary",
    would_not_return: "bg-danger/20 text-danger",
  };
  export function Badge({ status }: { status: PlaceStatus }) {
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{status.replace("_", " ")}</span>;
  }
  ```
- [ ] Create `frontend/src/components/ui/RatingInput.tsx`:
  ```tsx
  type Props = { label?: string; value: number; onChange: (n: number) => void };
  export function RatingInput({ label, value, onChange }: Props) {
    return (
      <label className="block">
        {label && <span className="block text-sm font-medium mb-1">{label}</span>}
        <input
          type="number" min={0} max={10} step={0.1} value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (n < 0 || n > 10 || Number.isNaN(n)) return;
            onChange(n);
          }}
          className="w-full rounded-xl border border-border px-3 py-2"
        />
      </label>
    );
  }
  ```
- [ ] Create `frontend/src/components/ui/EmptyState.tsx`:
  ```tsx
  export function EmptyState({ title, description }: { title: string; description?: string }) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-muted mt-2">{description}</p>}
      </div>
    );
  }
  ```
- [ ] Create `frontend/src/components/ui/LoadingState.tsx`:
  ```tsx
  export const LoadingState = () => <div className="text-center py-8 text-muted">Loading...</div>;
  ```
- [ ] Create `frontend/src/components/ui/ErrorMessage.tsx`:
  ```tsx
  export const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-danger/10 text-danger p-3 rounded-xl">{message}</div>
  );
  ```
- [ ] Create `frontend/src/components/ui/RatingInput.test.tsx`:
  ```tsx
  import { render, screen, fireEvent } from "@testing-library/react";
  import { useState } from "react";
  import { RatingInput } from "./RatingInput";

  function Wrapper() {
    const [v, setV] = useState(5);
    return <RatingInput label="r" value={v} onChange={setV} />;
  }

  test("rejects values < 0 or > 10", () => {
    render(<Wrapper />);
    const input = screen.getByLabelText("r") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "11" } });
    expect(input.value).toBe("5");
    fireEvent.change(input, { target: { value: "-1" } });
    expect(input.value).toBe("5");
    fireEvent.change(input, { target: { value: "7" } });
    expect(input.value).toBe("7");
  });
  ```
- [ ] Run: `npm run test`. Expected: RatingInput test passes.
- [ ] Commit: `git add -A && git commit -m "feat(frontend): UI component library"`

---

## Task 14: Auth routes + guards + pages

- [ ] Create `frontend/src/components/auth/ProtectedRoute.tsx`:
  ```tsx
  import { Navigate } from "react-router-dom";
  import { ACCESS_KEY } from "../../utils/constants";
  export function ProtectedRoute({ children }: { children: JSX.Element }) {
    return localStorage.getItem(ACCESS_KEY) ? children : <Navigate to="/login" replace />;
  }
  ```
- [ ] Create `frontend/src/components/auth/PublicRoute.tsx`:
  ```tsx
  import { Navigate } from "react-router-dom";
  import { ACCESS_KEY } from "../../utils/constants";
  export function PublicRoute({ children }: { children: JSX.Element }) {
    return localStorage.getItem(ACCESS_KEY) ? <Navigate to="/places" replace /> : children;
  }
  ```
- [ ] Create `frontend/src/routes/LoginPage.tsx`:
  ```tsx
  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { useAuth } from "../contexts/AuthContext";
  import { Button } from "../components/ui/Button";
  import { Input } from "../components/ui/Input";
  import { ErrorMessage } from "../components/ui/ErrorMessage";

  export default function LoginPage() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
    return (
      <form onSubmit={async (e) => { e.preventDefault(); try { await login(u, p); nav("/places"); } catch { setErr("Invalid credentials"); } }} className="max-w-sm mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        <Input label="Username" value={u} onChange={(e) => setU(e.target.value)} />
        <Input label="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} />
        {err && <ErrorMessage message={err} />}
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    );
  }
  ```
- [ ] Create `frontend/src/routes/RegisterPage.tsx`:
  ```tsx
  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { authService } from "../services/auth.service";
  import { Button } from "../components/ui/Button";
  import { Input } from "../components/ui/Input";
  import { ErrorMessage } from "../components/ui/ErrorMessage";

  export default function RegisterPage() {
    const nav = useNavigate();
    const [f, setF] = useState({ username: "", email: "", password: "", confirm_password: "" });
    const [err, setErr] = useState("");
    const upd = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
    return (
      <form onSubmit={async (e) => { e.preventDefault(); try { await authService.register(f); nav("/login"); } catch { setErr("Could not register"); } }} className="max-w-sm mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Register</h1>
        <Input label="Username" value={f.username} onChange={upd("username")} />
        <Input label="Email" value={f.email} onChange={upd("email")} />
        <Input label="Password" type="password" value={f.password} onChange={upd("password")} />
        <Input label="Confirm password" type="password" value={f.confirm_password} onChange={upd("confirm_password")} />
        {err && <ErrorMessage message={err} />}
        <Button type="submit" className="w-full">Create account</Button>
      </form>
    );
  }
  ```
- [ ] Create `frontend/src/components/auth/ProtectedRoute.test.tsx`:
  ```tsx
  import { render, screen } from "@testing-library/react";
  import { MemoryRouter, Route, Routes } from "react-router-dom";
  import { ProtectedRoute } from "./ProtectedRoute";
  import { ACCESS_KEY } from "../../utils/constants";

  test("redirects unauthenticated to /login", () => {
    localStorage.removeItem(ACCESS_KEY);
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/private" element={<ProtectedRoute><div>SECRET</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });
  ```
- [ ] Create `frontend/src/components/auth/PublicRoute.test.tsx`:
  ```tsx
  import { render, screen } from "@testing-library/react";
  import { MemoryRouter, Route, Routes } from "react-router-dom";
  import { PublicRoute } from "./PublicRoute";
  import { ACCESS_KEY } from "../../utils/constants";

  test("redirects authenticated to /places", () => {
    localStorage.setItem(ACCESS_KEY, "x");
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/places" element={<div>PLACES</div>} />
          <Route path="/login" element={<PublicRoute><div>LOGIN</div></PublicRoute>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("PLACES")).toBeInTheDocument();
    localStorage.removeItem(ACCESS_KEY);
  });
  ```
- [ ] Run: `npm run test`. Expected: all 3+ tests pass.
- [ ] Commit: `git add -A && git commit -m "feat(frontend): auth pages and route guards"`

---

## Task 15: Places service + PlacesPage

- [ ] Create `frontend/src/services/places.service.ts`:
  ```ts
  import { api } from "./api";
  import type { Place, PlaceStatus } from "../types/place";

  export interface Page<T> { count: number; next: string | null; previous: string | null; results: T[] }

  export const placesService = {
    list: (params: { page?: number; status?: PlaceStatus; search?: string } = {}) =>
      api.get<Page<Place>>("/places/", { params }).then((r) => r.data),
    get: (id: number) => api.get<Place>(`/places/${id}/`).then((r) => r.data),
    create: (data: Partial<Place>) => api.post<Place>("/places/", data).then((r) => r.data),
    update: (id: number, data: Partial<Place>) => api.patch<Place>(`/places/${id}/`, data).then((r) => r.data),
    remove: (id: number) => api.delete(`/places/${id}/`),
  };
  ```
- [ ] Create `frontend/src/components/places/PlaceCard.tsx`:
  ```tsx
  import { Link } from "react-router-dom";
  import type { Place } from "../../types/place";
  import { Card } from "../ui/Card";
  import { Badge } from "../ui/Badge";

  export function PlaceCard({ place }: { place: Place }) {
    return (
      <Link to={`/places/${place.id}`}>
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{place.name}</h3>
              <p className="text-muted text-sm">{place.category}</p>
              {place.address && <p className="text-muted text-xs">{place.address}</p>}
            </div>
            <Badge status={place.status} />
          </div>
        </Card>
      </Link>
    );
  }
  ```
- [ ] Create `frontend/src/routes/PlacesPage.tsx`:
  ```tsx
  import { useEffect, useState } from "react";
  import { Link } from "react-router-dom";
  import { placesService, type Page } from "../services/places.service";
  import type { Place, PlaceStatus } from "../types/place";
  import { PLACE_STATUSES } from "../utils/constants";
  import { PlaceCard } from "../components/places/PlaceCard";
  import { Button } from "../components/ui/Button";
  import { Input } from "../components/ui/Input";
  import { EmptyState } from "../components/ui/EmptyState";
  import { LoadingState } from "../components/ui/LoadingState";
  import { ErrorMessage } from "../components/ui/ErrorMessage";

  export default function PlacesPage() {
    const [data, setData] = useState<Page<Place> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<PlaceStatus | "">("");
    const [page, setPage] = useState(1);

    useEffect(() => {
      setLoading(true);
      placesService.list({ page, search: search || undefined, status: (status || undefined) as PlaceStatus })
        .then(setData).catch(() => setError("Failed to load")).finally(() => setLoading(false));
    }, [search, status, page]);

    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My places</h1>
          <Link to="/places/new"><Button>New</Button></Link>
        </div>
        <Input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={status === "" ? "primary" : "secondary"} onClick={() => setStatus("")}>All</Button>
          {PLACE_STATUSES.map((s) => (
            <Button key={s.value} size="sm" variant={status === s.value ? "primary" : "secondary"} onClick={() => setStatus(s.value)}>{s.label}</Button>
          ))}
        </div>
        {loading && <LoadingState />}
        {error && <ErrorMessage message={error} />}
        {data && data.count === 0 && <EmptyState title="No places yet" description="Add your first place." />}
        {data && data.results.map((p) => <PlaceCard key={p.id} place={p} />)}
        {data && (data.next || data.previous) && (
          <div className="flex justify-between">
            <Button disabled={!data.previous} onClick={() => setPage((n) => n - 1)}>Previous</Button>
            <Button disabled={!data.next} onClick={() => setPage((n) => n + 1)}>Next</Button>
          </div>
        )}
      </div>
    );
  }
  ```
- [ ] Commit: `git add -A && git commit -m "feat(frontend): places service, list page, card"`

---

## Task 16: Place detail + form pages

- [ ] Create `frontend/src/components/places/PlaceForm.tsx`:
  ```tsx
  import { useState } from "react";
  import type { Place, PlaceStatus } from "../../types/place";
  import { PLACE_STATUSES } from "../../utils/constants";
  import { Input } from "../ui/Input";
  import { Textarea } from "../ui/Textarea";
  import { Select } from "../ui/Select";
  import { Button } from "../ui/Button";

  type Props = { initial?: Partial<Place>; onSubmit: (data: Partial<Place>) => Promise<void> };

  export function PlaceForm({ initial = {}, onSubmit }: Props) {
    const [f, setF] = useState<Partial<Place>>({ status: "want_to_visit", ...initial });
    const [error, setError] = useState("");
    const upd = (k: keyof Place) => (e: any) => setF({ ...f, [k]: e.target.value });
    return (
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!f.name?.trim()) { setError("Name is required"); return; }
        await onSubmit(f);
      }} className="space-y-3">
        <Input label="Name" value={f.name || ""} onChange={upd("name")} error={error} />
        <Input label="Category" value={f.category || ""} onChange={upd("category")} />
        <Input label="Address" value={f.address || ""} onChange={upd("address")} />
        <Input label="Instagram URL" value={f.instagram_url || ""} onChange={upd("instagram_url")} />
        <Input label="Maps URL" value={f.maps_url || ""} onChange={upd("maps_url")} />
        <Select label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as PlaceStatus })}>
          {PLACE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Textarea label="Notes" value={f.notes || ""} onChange={upd("notes")} />
        <Button type="submit" className="w-full">Save</Button>
      </form>
    );
  }
  ```
- [ ] Create `frontend/src/routes/NewPlacePage.tsx`:
  ```tsx
  import { useNavigate } from "react-router-dom";
  import { placesService } from "../services/places.service";
  import { PlaceForm } from "../components/places/PlaceForm";

  export default function NewPlacePage() {
    const nav = useNavigate();
    return (
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">New place</h1>
        <PlaceForm onSubmit={async (d) => { const p = await placesService.create(d); nav(`/places/${p.id}`); }} />
      </div>
    );
  }
  ```
- [ ] Create `frontend/src/routes/EditPlacePage.tsx`:
  ```tsx
  import { useEffect, useState } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import { placesService } from "../services/places.service";
  import type { Place } from "../types/place";
  import { PlaceForm } from "../components/places/PlaceForm";
  import { LoadingState } from "../components/ui/LoadingState";

  export default function EditPlacePage() {
    const { id } = useParams();
    const nav = useNavigate();
    const [place, setPlace] = useState<Place | null>(null);
    useEffect(() => { placesService.get(Number(id)).then(setPlace); }, [id]);
    if (!place) return <LoadingState />;
    return (
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Edit place</h1>
        <PlaceForm initial={place} onSubmit={async (d) => { await placesService.update(place.id, d); nav(`/places/${place.id}`); }} />
      </div>
    );
  }
  ```
- [ ] Create `frontend/src/routes/PlaceDetailPage.tsx`:
  ```tsx
  import { useEffect, useState } from "react";
  import { Link, useNavigate, useParams } from "react-router-dom";
  import { placesService } from "../services/places.service";
  import type { Place } from "../types/place";
  import { Card } from "../components/ui/Card";
  import { Button } from "../components/ui/Button";
  import { Badge } from "../components/ui/Badge";
  import { LoadingState } from "../components/ui/LoadingState";
  import { VisitCard } from "../components/visits/VisitCard";

  export default function PlaceDetailPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const [place, setPlace] = useState<Place & { visits: any[] } | null>(null);
    useEffect(() => { placesService.get(Number(id)).then(setPlace as any); }, [id]);
    if (!place) return <LoadingState />;
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card>
          <div className="flex justify-between">
            <div>
              <h1 className="text-2xl font-bold">{place.name}</h1>
              <p className="text-muted">{place.category}</p>
              <Badge status={place.status} />
            </div>
            <div className="flex gap-2">
              <Link to={`/places/${place.id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
              <Button variant="danger" size="sm" onClick={async () => { await placesService.remove(place.id); nav("/places"); }}>Delete</Button>
            </div>
          </div>
          {place.address && <p className="mt-2 text-muted">{place.address}</p>}
          {place.notes && <p className="mt-2">{place.notes}</p>}
        </Card>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Visits</h2>
          <Link to={`/places/${place.id}/visits/new`}><Button size="sm">Add visit</Button></Link>
        </div>
        {place.visits.length === 0 ? <p className="text-muted">No visits yet.</p> : place.visits.map((v: any) => <VisitCard key={v.id} visit={v} />)}
      </div>
    );
  }
  ```
- [ ] Commit: `git add -A && git commit -m "feat(frontend): place form, detail, edit pages"`

---

## Task 17: Visits service + visit pages

- [ ] Create `frontend/src/services/visits.service.ts`:
  ```ts
  import { api } from "./api";
  import type { Visit } from "../types/visit";

  export const visitsService = {
    create: (placeId: number, data: Partial<Visit>) =>
      api.post<Visit>(`/places/${placeId}/visits/`, data).then((r) => r.data),
    update: (id: number, data: Partial<Visit>) =>
      api.patch<Visit>(`/visits/${id}/`, data).then((r) => r.data),
    remove: (id: number) => api.delete(`/visits/${id}/`),
  };
  ```
- [ ] Create `frontend/src/services/visit-items.service.ts`:
  ```ts
  import { api } from "./api";
  import type { VisitItem } from "../types/visit-item";

  export const visitItemsService = {
    create: (visitId: number, data: Partial<VisitItem>) =>
      api.post<VisitItem>(`/visits/${visitId}/items/`, data).then((r) => r.data),
    update: (id: number, data: Partial<VisitItem>) =>
      api.patch<VisitItem>(`/visit-items/${id}/`, data).then((r) => r.data),
    remove: (id: number) => api.delete(`/visit-items/${id}/`),
  };
  ```
- [ ] Create `frontend/src/components/visits/VisitItemForm.tsx`:
  ```tsx
  import type { VisitItem, VisitItemType } from "../../types/visit-item";
  import { VISIT_ITEM_TYPES } from "../../utils/constants";
  import { Input } from "../ui/Input";
  import { Select } from "../ui/Select";
  import { RatingInput } from "../ui/RatingInput";
  import { Button } from "../ui/Button";

  type Props = { value: Partial<VisitItem>; onChange: (v: Partial<VisitItem>) => void; onRemove: () => void };
  export function VisitItemForm({ value, onChange, onRemove }: Props) {
    return (
      <div className="border border-border rounded-xl p-3 space-y-2">
        <Input label="Item name" value={value.name || ""} onChange={(e) => onChange({ ...value, name: e.target.value })} />
        <Select label="Type" value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value as VisitItemType })}>
          {VISIT_ITEM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <RatingInput label="Rating (0-10)" value={Number(value.rating ?? 0)} onChange={(n) => onChange({ ...value, rating: n })} />
        <Input label="Price" type="number" min={0} step="0.01" value={String(value.price ?? "")} onChange={(e) => onChange({ ...value, price: e.target.value })} />
        <Button type="button" variant="danger" size="sm" onClick={onRemove}>Remove</Button>
      </div>
    );
  }
  ```
- [ ] Create `frontend/src/components/visits/VisitForm.tsx`:
  ```tsx
  import { useState } from "react";
  import type { Visit } from "../../types/visit";
  import type { VisitItem } from "../../types/visit-item";
  import { Input } from "../ui/Input";
  import { Textarea } from "../ui/Textarea";
  import { RatingInput } from "../ui/RatingInput";
  import { Button } from "../ui/Button";
  import { VisitItemForm } from "./VisitItemForm";

  type Props = {
    initial?: Partial<Visit>;
    initialItems?: Partial<VisitItem>[];
    onSubmit: (visit: Partial<Visit>, items: Partial<VisitItem>[]) => Promise<void>;
  };

  export function VisitForm({ initial = {}, initialItems = [], onSubmit }: Props) {
    const [v, setV] = useState<Partial<Visit>>({
      visited_at: new Date().toISOString().slice(0, 16),
      environment_rating: 7, service_rating: 7, overall_rating: 7,
      would_return: true, ...initial,
    });
    const [items, setItems] = useState<Partial<VisitItem>[]>(initialItems);
    return (
      <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(v, items); }} className="space-y-3">
        <Input label="Visited at" type="datetime-local" value={(v.visited_at || "").slice(0, 16)} onChange={(e) => setV({ ...v, visited_at: e.target.value })} />
        <RatingInput label="Environment" value={Number(v.environment_rating ?? 0)} onChange={(n) => setV({ ...v, environment_rating: n })} />
        <RatingInput label="Service" value={Number(v.service_rating ?? 0)} onChange={(n) => setV({ ...v, service_rating: n })} />
        <RatingInput label="Overall" value={Number(v.overall_rating ?? 0)} onChange={(n) => setV({ ...v, overall_rating: n })} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!v.would_return} onChange={(e) => setV({ ...v, would_return: e.target.checked })} />
          Would return
        </label>
        <Textarea label="General notes" value={v.general_notes || ""} onChange={(e) => setV({ ...v, general_notes: e.target.value })} />
        <h3 className="font-semibold">Items</h3>
        {items.map((it, i) => (
          <VisitItemForm key={i} value={it}
            onChange={(nv) => setItems(items.map((x, j) => (j === i ? nv : x)))}
            onRemove={() => setItems(items.filter((_, j) => j !== i))} />
        ))}
        <Button type="button" variant="secondary" onClick={() => setItems([...items, { type: "other", rating: 7, price: "0", would_order_again: true }])}>Add item</Button>
        <Button type="submit" className="w-full">Save visit</Button>
      </form>
    );
  }
  ```
- [ ] Create `frontend/src/components/visits/VisitCard.tsx`:
  ```tsx
  import type { Visit } from "../../types/visit";
  import { Card } from "../ui/Card";
  import { fmtDate, fmtRating, fmtPrice } from "../../utils/formatters";

  export function VisitCard({ visit }: { visit: Visit }) {
    return (
      <Card>
        <p className="font-semibold">{fmtDate(visit.visited_at)}</p>
        <p className="text-sm">Overall: {fmtRating(visit.overall_rating)} · Env: {fmtRating(visit.environment_rating)} · Service: {fmtRating(visit.service_rating)}</p>
        {visit.general_notes && <p className="mt-1 text-muted text-sm">{visit.general_notes}</p>}
        {visit.items.length > 0 && (
          <ul className="mt-2 space-y-1">
            {visit.items.map((it) => (
              <li key={it.id} className="text-sm">• {it.name} ({it.type}) — {fmtRating(it.rating)} · {fmtPrice(it.price)}</li>
            ))}
          </ul>
        )}
      </Card>
    );
  }
  ```
- [ ] Create `frontend/src/routes/NewVisitPage.tsx`:
  ```tsx
  import { useNavigate, useParams } from "react-router-dom";
  import { visitsService } from "../services/visits.service";
  import { visitItemsService } from "../services/visit-items.service";
  import { VisitForm } from "../components/visits/VisitForm";

  export default function NewVisitPage() {
    const { id } = useParams();
    const nav = useNavigate();
    return (
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">New visit</h1>
        <VisitForm onSubmit={async (visit, items) => {
          const created = await visitsService.create(Number(id), visit);
          for (const it of items) await visitItemsService.create(created.id, it);
          nav(`/places/${id}`);
        }} />
      </div>
    );
  }
  ```
- [ ] Create `frontend/src/routes/EditVisitPage.tsx`:
  ```tsx
  import { useNavigate, useParams } from "react-router-dom";
  import { visitsService } from "../services/visits.service";
  import { VisitForm } from "../components/visits/VisitForm";

  export default function EditVisitPage() {
    const { id } = useParams();
    const nav = useNavigate();
    return (
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Edit visit</h1>
        <VisitForm onSubmit={async (visit) => { await visitsService.update(Number(id), visit); nav(-1 as any); }} />
      </div>
    );
  }
  ```
- [ ] Commit: `git add -A && git commit -m "feat(frontend): visit + visit-item forms and pages"`

---

## Task 18: App routing

- [ ] Replace `frontend/src/App.tsx`:
  ```tsx
  import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
  import { AuthProvider } from "./contexts/AuthContext";
  import { ProtectedRoute } from "./components/auth/ProtectedRoute";
  import { PublicRoute } from "./components/auth/PublicRoute";
  import LoginPage from "./routes/LoginPage";
  import RegisterPage from "./routes/RegisterPage";
  import PlacesPage from "./routes/PlacesPage";
  import NewPlacePage from "./routes/NewPlacePage";
  import EditPlacePage from "./routes/EditPlacePage";
  import PlaceDetailPage from "./routes/PlaceDetailPage";
  import NewVisitPage from "./routes/NewVisitPage";
  import EditVisitPage from "./routes/EditVisitPage";
  import { ACCESS_KEY } from "./utils/constants";

  export default function App() {
    return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to={localStorage.getItem(ACCESS_KEY) ? "/places" : "/login"} replace />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/places" element={<ProtectedRoute><PlacesPage /></ProtectedRoute>} />
            <Route path="/places/new" element={<ProtectedRoute><NewPlacePage /></ProtectedRoute>} />
            <Route path="/places/:id" element={<ProtectedRoute><PlaceDetailPage /></ProtectedRoute>} />
            <Route path="/places/:id/edit" element={<ProtectedRoute><EditPlacePage /></ProtectedRoute>} />
            <Route path="/places/:id/visits/new" element={<ProtectedRoute><NewVisitPage /></ProtectedRoute>} />
            <Route path="/visits/:id/edit" element={<ProtectedRoute><EditVisitPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    );
  }
  ```
- [ ] Commit: `git add -A && git commit -m "feat(frontend): wire routes and auth provider"`

---

## Task 19: Frontend integration tests

- [ ] Create `frontend/src/services/api.test.ts`:
  ```ts
  import { api } from "./api";
  import { ACCESS_KEY } from "../utils/constants";

  test("adds Authorization header from localStorage", async () => {
    localStorage.setItem(ACCESS_KEY, "abc123");
    const cfg = await (api.interceptors.request as any).handlers[0].fulfilled({ headers: {} });
    expect(cfg.headers.Authorization).toBe("Bearer abc123");
    localStorage.removeItem(ACCESS_KEY);
  });
  ```
- [ ] Create `frontend/src/routes/LoginPage.test.tsx`:
  ```tsx
  import { render, screen } from "@testing-library/react";
  import { MemoryRouter } from "react-router-dom";
  import { AuthProvider } from "../contexts/AuthContext";
  import LoginPage from "./LoginPage";

  test("renders username and password fields", () => {
    render(<MemoryRouter><AuthProvider><LoginPage /></AuthProvider></MemoryRouter>);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
  ```
- [ ] Create `frontend/src/routes/RegisterPage.test.tsx`:
  ```tsx
  import { render, screen } from "@testing-library/react";
  import { MemoryRouter } from "react-router-dom";
  import RegisterPage from "./RegisterPage";

  test("renders all register fields", () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });
  ```
- [ ] Create `frontend/src/components/places/PlaceCard.test.tsx`:
  ```tsx
  import { render, screen } from "@testing-library/react";
  import { MemoryRouter } from "react-router-dom";
  import { PlaceCard } from "./PlaceCard";

  test("renders main place data", () => {
    render(
      <MemoryRouter>
        <PlaceCard place={{ id: 1, name: "Café X", category: "café", address: "Rua Y", status: "favorite", created_at: "", updated_at: "" } as any} />
      </MemoryRouter>
    );
    expect(screen.getByText("Café X")).toBeInTheDocument();
    expect(screen.getByText("café")).toBeInTheDocument();
    expect(screen.getByText("Rua Y")).toBeInTheDocument();
  });
  ```
- [ ] Create `frontend/src/components/places/PlaceForm.test.tsx`:
  ```tsx
  import { render, screen, fireEvent, waitFor } from "@testing-library/react";
  import { PlaceForm } from "./PlaceForm";

  test("requires name", async () => {
    const onSubmit = vi.fn();
    render(<PlaceForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });
  ```
- [ ] Create `frontend/src/routes/PlacesPage.test.tsx`:
  ```tsx
  import { render, screen, waitFor } from "@testing-library/react";
  import { MemoryRouter } from "react-router-dom";
  import { vi } from "vitest";
  import PlacesPage from "./PlacesPage";
  import { placesService } from "../services/places.service";

  vi.mock("../services/places.service");

  test("shows empty state when no places", async () => {
    (placesService.list as any).mockResolvedValue({ count: 0, results: [], next: null, previous: null });
    render(<MemoryRouter><PlacesPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/no places yet/i)).toBeInTheDocument());
  });

  test("renders list of places", async () => {
    (placesService.list as any).mockResolvedValue({
      count: 1, next: null, previous: null,
      results: [{ id: 1, name: "Padaria", category: "bakery", address: "", status: "visited", created_at: "", updated_at: "" }],
    });
    render(<MemoryRouter><PlacesPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("Padaria")).toBeInTheDocument());
  });
  ```
- [ ] Run: `npm run test`. Expected: all tests pass.
- [ ] Commit: `git add -A && git commit -m "test(frontend): integration tests for auth, places, api"`

---

## Task 20: Final validation

- [ ] Run backend tests: `cd backend && pytest -v`. Expected: all pass.
- [ ] Run frontend tests: `cd frontend && npm run test`. Expected: all pass.
- [ ] Build frontend: `cd frontend && npm run build`. Expected: no TS errors, `dist/` produced.
- [ ] Start full stack:
  ```bash
  docker compose up -d db
  (cd backend && python manage.py runserver) &
  (cd frontend && npm run dev) &
  ```
- [ ] Smoke test in browser at `http://localhost:5173`:
  - [ ] Register new user → redirected to /login
  - [ ] Login → redirected to /places (empty state shown)
  - [ ] Create place "Padaria Bom Pão", category "bakery", status "want_to_visit" → appears in list
  - [ ] Open detail → "Add visit" → fill ratings + add 2 items → save
  - [ ] Place detail shows visit + items
  - [ ] Filter by status "Visited" → list updates
  - [ ] Search "Padaria" → matches
  - [ ] Logout → redirected to /login
  - [ ] Re-login → state preserved
- [ ] Final commit: `git add -A && git commit -m "chore: MVP complete - all tests pass, smoke validated"`

---

## Done

The Bora Ali MVP is complete: registered users can manage places, log visits with rated items, filter and search their history, all backed by a typed API contract with full test coverage on both layers.
