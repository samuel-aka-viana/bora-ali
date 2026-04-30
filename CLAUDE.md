# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bora Ali** is a personal diary webapp for tracking places (cafés, restaurants, bars, etc.) the user wants to visit or has visited. Users can register visits, rate environment/service/experience, log ordered items, and browse their history.

The full MVP specification lives in `skills.md`.

## Architecture

```
Browser → React SPA (frontend/) → Django REST API (backend/) → PostgreSQL
                                                              ↓
                                                   Jaeger (OTLP traces)
```

- **backend/**: Django + Django REST Framework + SimpleJWT + PostgreSQL
- **frontend/**: React + Vite + TypeScript + Tailwind CSS
- **docker-compose.yml**: PostgreSQL + Jaeger (observability UI at `http://localhost:16686`)

## Backend Commands

All backend commands run from `backend/` with the virtualenv active:

```bash
source .venv/bin/activate

# Development server
python manage.py runserver

# Database migrations
python manage.py makemigrations
python manage.py migrate

# Tests
pytest                        # all tests
pytest accounts/              # single app
pytest -k test_name           # single test

# Code quality
black .
isort .
flake8
```

## Frontend Commands

All frontend commands run from `frontend/`:

```bash
npm run dev       # dev server (http://localhost:5173)
npm run build     # tsc + vite build
npm run test      # vitest
npm run lint      # eslint
```

## Database & Observability

PostgreSQL + Jaeger via Docker Compose:

```bash
docker compose up -d   # starts postgres + jaeger
```

Credentials from `.env` (see `.env.example` in backend/).

## OpenTelemetry

Tracing is opt-in via env vars. Add to `backend/.env` to enable:

```
OTEL_SERVICE_NAME=bora-ali
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

- Traces are sent to Jaeger (`docker compose up -d`) via OTLP HTTP on port 4318
- Jaeger UI: `http://localhost:16686`
- Instruments: Django requests, SQL queries (psycopg), and log correlation
- Implementation: `backend/config/telemetry.py` — activated in `manage.py` and `wsgi.py` when `OTEL_EXPORTER_OTLP_ENDPOINT` is set

## Key Design Decisions

**Data model hierarchy**: `User → Place → Visit → VisitItem`. All FKs sit on the "many" side. Ratings are 0–10 integers. `cover_photo` and `photo` store uploaded image files via Django's file storage (local filesystem or S3-compatible via `django-storages`).

**Ownership enforcement**: Every queryset filters by `request.user`. Never return data from other users.
- `Place`: `filter(user=request.user)`
- `Visit`: `filter(place__user=request.user)`
- `VisitItem`: `filter(visit__place__user=request.user)`

**Auth**: SimpleJWT with `ROTATE_REFRESH_TOKENS=True` and `BLACKLIST_AFTER_ROTATION=True`. Logout must blacklist the refresh token. Frontend must save the new refresh token on every rotation (see `api.ts`).

**Single-session enforcement**: Each user has one `UserSession` row with a `session_key` UUID. On login the key rotates. The `session_key` is embedded in both access and refresh tokens and validated on every authenticated request via `SingleSessionJWTAuthentication`. Logging in from a new device immediately invalidates all prior sessions — the old token's `session_key` no longer matches the DB. The frontend detects `session_expired` / `session_invalidated` error codes and shows an amber banner on the login page (`SESSION_INVALIDATED_KEY` localStorage flag).

**Rate limiting**: DRF throttle — `auth` scope at 10/minute on register/login/refresh endpoints (`accounts/throttles.py`).

**API shape**: REST JSON with DRF `PageNumberPagination` (PAGE_SIZE=20). All list endpoints must be paginated.

**Error handling**: All custom exceptions live in `core/exceptions.py`. Error messages are lazy-translated strings in `core/messages.py`. The global DRF exception handler is `core/exception_handler.semantic_exception_handler` — it returns `{"code": "<code>", "detail": "<message>"}` for all errors. Do not raise raw DRF exceptions from views; raise the typed exceptions from `core.exceptions` instead.

**i18n (backend)**: Django GNU gettext with `LocaleMiddleware`. `.po` files in `backend/locale/<lang>/LC_MESSAGES/django.po`. Run `python manage.py makemessages -l pt_BR` and `compilemessages` after adding new translated strings.

**i18n (frontend)**: `react-i18next` with inline JSON resources (not HTTP fetched). Translation files at `frontend/src/locales/<lang>/translation.json`. Language preference stored in `localStorage` under `boraali_lang`. A Node.js script `scripts/po-to-i18n.cjs` converts Django `.po` → i18next JSON when needed.

**File storage**: Controlled by `USE_VERSITYGW` env var. `False` (default) uses local `FileSystemStorage`. `True` uses `django-storages` S3Boto3 pointing at a VersityGW (S3-compatible) endpoint. Configuration in `settings.py` under `STORAGES`.

## Backend App Structure

```
backend/
  config/               # Django project (settings, urls, wsgi, telemetry)
  core/                 # Shared utilities
    exceptions.py       # Typed APIException subclasses (always raise these, not raw DRF exceptions)
    messages.py         # Lazy-translated message strings (used in exceptions and serializers)
    exception_handler.py # semantic_exception_handler — registered in REST_FRAMEWORK settings
    viewsets.py         # Base viewset mixins
  accounts/             # User auth: register, login, refresh, logout, me
    models.py           # UserSession model (single-session enforcement)
    authentication.py   # SingleSessionJWTAuthentication
    token_serializers.py # SingleSessionTokenObtainPairSerializer, SingleSessionTokenRefreshSerializer
    serializers.py      # RegisterSerializer, UserSerializer
    views.py            # ThrottledLoginView, ThrottledRefreshView, LogoutView, MeView, RegisterView
    throttles.py        # AuthRateThrottle
    tests/
      test_auth.py                       # Auth endpoint integration tests
      test_single_session.py             # Unit tests: UserSession model + token serializers
      test_single_session_integration.py # Integration tests: full login → invalidation flows
  places/               # Place, Visit, VisitItem models, serializers, viewsets, filters
    tests/
      test_places.py      # Place CRUD tests
      test_visits.py      # Visit CRUD tests
      test_visit_items.py # VisitItem CRUD tests
  locale/               # GNU gettext .po/.mo files
    pt_BR/LC_MESSAGES/django.po
```

Auth endpoints: `/api/auth/{register,login,refresh,logout,me}/`  
Places endpoints: `/api/places/`, `/api/places/{id}/visits/`, `/api/visits/{id}/items/`  
API docs: `/api/docs/` (drf-spectacular Swagger UI)

## Backend Commands (additional)

```bash
# i18n
python manage.py makemessages -l pt_BR   # extract strings from code
python manage.py compilemessages          # compile .po → .mo (required after edits)
```

## Frontend Structure

```
frontend/src/
  routes/          # Page components
    LoginPage.tsx          # Login form + session-expired amber banner
    RegisterPage.tsx
    PlacesPage.tsx
    PlaceDetailPage.tsx
    NewPlacePage.tsx / EditPlacePage.tsx
    NewVisitPage.tsx / EditVisitPage.tsx
  components/
    ui/            # Button, Input, Card, Badge, RatingInput, Select, Textarea,
                   # DateTimePicker, LanguageToggle, EmptyState, LoadingState, ErrorMessage, BackButton
    auth/          # ProtectedRoute, PublicRoute
    places/        # PlaceCard, PlaceForm
    visits/        # VisitCard, VisitForm, VisitItemForm
  services/
    api.ts              # axios client — adds Bearer token, handles 401 (refresh → logout),
                        # saves rotated refresh token, detects session invalidation codes
    api-errors.ts       # getApiErrorState() — maps API error codes to display messages + field errors
    auth.service.ts
    places.service.ts
    visits.service.ts
    visit-items.service.ts
    form-data.ts        # buildFormData() — converts plain objects to multipart FormData (auto-wraps File fields)
  types/           # TypeScript interfaces: place.ts, visit.ts, visit-item.ts, user.ts
  utils/
    constants.ts   # ACCESS_KEY, REFRESH_KEY, SESSION_INVALIDATED_KEY, PLACE_STATUSES, VISIT_ITEM_TYPES
    formatters.ts
  i18n/
    index.ts       # react-i18next setup — reads localStorage boraali_lang, falls back to pt-BR
  locales/
    pt-BR/translation.json
    en/translation.json
  contexts/        # AuthContext, useAuth hook
```

`services/api.ts` must add `Authorization: Bearer <token>` to all requests and handle 401 globally (attempt refresh → logout on failure). On successful refresh, **save both** the new access and refresh tokens from the response. API base URL comes from `VITE_API_URL` env var.

`services/api-errors.ts` exposes `getApiErrorState(error, fallbackMessage)` — call this in every catch block on form submit to get `{ message, fieldErrors }` for display.

## Visual Identity

Primary color `#EA1D2C`, background `#FAFAFA`, mobile-first layout. Cards with rounded corners and light shadow. No social features, no maps integration, no file uploads — these are Phase 2+.

## What NOT to Build in MVP

microservices, queues, websockets, social feeds, likes, geolocation, Google Places, Instagram import, payments, PWA, app store, Google OAuth.
