# CLAUDE.md

**Bora Ali** — personal place diary (cafés, restaurants, bars). `User → Place → Visit → VisitItem`.

## Stack
- **backend/**: Django + DRF + SimpleJWT + PostgreSQL
- **frontend/**: React + Vite + TypeScript + Tailwind, served by nginx (`/api/` proxied to backend)
- **docker-compose.yml** (root): full stack — frontend, backend, postgres, VersityGW, Jaeger

## Commands

```bash
# backend/ (venv active)
python manage.py runserver
python manage.py makemigrations && python manage.py migrate
pytest / pytest accounts/ / pytest -k test_name
black . && isort . && flake8
python manage.py makemessages -l pt_BR && python manage.py compilemessages

# frontend/
npm run dev / npm run build / npm run test / npm run lint

# root
docker compose up -d --build
```

Services: `localhost` (frontend), `localhost/api/` (API), `:8081` (VersityGW), `:16686` (Jaeger).

## Key Design Decisions

**Ownership**: Every queryset filters by `request.user`. Never leak other users' data.
- `Place`: `filter(user=request.user)` / `Visit`: `filter(place__user=...)` / `VisitItem`: `filter(visit__place__user=...)`

**Auth**: SimpleJWT with `ROTATE_REFRESH_TOKENS=True`. Logout blacklists refresh token. Frontend saves both tokens on every rotation.

**Single-session**: `UserSession` row per user with rotating `session_key` embedded in JWTs, validated by `SingleSessionJWTAuthentication`. New login invalidates prior sessions. Frontend shows amber banner on `session_expired`/`session_invalidated` codes.

**Public identifiers**: `id` = internal PK (FK joins only). `public_id` = UUID exposed in all API URLs/payloads. ViewSets: `lookup_field = "public_id"`. Safe migration pattern: add nullable → `RunPython` populate → `AlterField` unique+non-null.

**Error handling**: Raise typed exceptions from `core.exceptions`, never raw DRF. Handler at `core/exception_handler.semantic_exception_handler` returns `{"code": "...", "detail": "..."}`.

**Maps embed**: `latitude`/`longitude` auto-extracted from `maps_url` via regex in `PlaceWriteSerializer._sync_coords()`. Frontend shows Google Maps iframe modal — no API key needed.

**File storage**: `USE_VERSITYGW=False` → local filesystem. `True` → django-storages S3Boto3 → VersityGW.

**i18n backend**: GNU gettext + `LocaleMiddleware`. **i18n frontend**: react-i18next, JSON files at `frontend/src/locales/<lang>/translation.json`, lang in `localStorage.boraali_lang`.

**API shape**: DRF `PageNumberPagination` (PAGE_SIZE=20). All list endpoints paginated.

## Backend Structure

```
backend/
  config/         # settings, urls, wsgi, telemetry
  core/           # PublicIdModel (models.py), exceptions, messages, exception_handler, viewsets
  accounts/       # auth: UserSession, SingleSessionJWTAuthentication, throttles, views, serializers
  places/         # Place, Visit, VisitItem — models, serializers, viewsets
  locale/pt_BR/   # .po/.mo files
```

Endpoints: `/api/auth/{register,login,refresh,logout,me}/` · `/api/places/` · `/api/places/{public_id}/visits/` · `/api/visits/{public_id}/items/` · `/api/docs/`

## Frontend Structure

```
frontend/src/
  routes/     # LoginPage, RegisterPage, PlacesPage, PlaceDetailPage, New/EditPlacePage, New/EditVisitPage
  components/
    ui/       # Button, Input, Card, Badge, RatingInput, Select, Textarea, DateTimePicker,
              # Modal (ESC + backdrop), MapModal (Maps iframe), EmptyState, LoadingState, BackButton
    places/   # PlaceCard, PlaceForm
    visits/   # VisitCard, VisitForm, VisitItemForm
  services/   # api.ts, api-errors.ts, auth/places/visits/visit-items.service.ts, form-data.ts
  types/      # place.ts, visit.ts, visit-item.ts, user.ts
  contexts/   # AuthContext
```

`api.ts`: adds Bearer token, handles 401 (refresh → logout), saves rotated tokens, detects session codes.  
`api-errors.ts`: `getApiErrorState(error, fallback)` → `{ message, fieldErrors }` — use in every form catch.  
`form-data.ts`: `toFormData()`, `hasFile()`, `stripStringImages()`.  
`constants.ts`: `ACCESS_KEY`, `REFRESH_KEY`, `SESSION_INVALIDATED_KEY`, `PLACE_STATUSES`, `VISIT_ITEM_TYPES`.

## Visual Identity

Primary `#EA1D2C`, bg `#FAFAFA`, mobile-first. Photo upload: dashed-border card dropzone (click to upload, hover to change, link to remove) — consistent across PlaceForm, VisitForm, VisitItemForm.

## Out of Scope

microservices, queues, websockets, social feeds, Instagram import, payments, PWA, Google OAuth.
