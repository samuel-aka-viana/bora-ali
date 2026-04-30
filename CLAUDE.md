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
  config/             # settings.py, urls.py, wsgi.py, telemetry, test_settings.py
  core/               # shared utilities (no Django app entry in INSTALLED_APPS)
    models.py         # PublicIdModel (abstract, adds public_id UUID)
    exceptions.py     # typed semantic exceptions
    exception_handler.py  # semantic_exception_handler → {"code","detail"}
    viewsets.py       # shared viewset mixins
    validators.py     # validate_image_upload(), validate_safe_url()
    storage_urls.py   # build_public_media_url() — S3 presigned or local URL
    image_service.py  # ImageService — encrypt/decrypt/save/delete/detect_content_type
    media_views.py    # serve_user_media — authenticated GET /api/media/<path>
    messages.py       # shared i18n message constants
    tests/            # test_models.py, test_security.py, test_image_service.py, test_media_views.py
  accounts/           # auth: UserSession, UserProfile, SingleSessionJWTAuthentication
    apps.py           # AccountsConfig.ready() imports accounts.signals
    signals.py        # post_delete → cleanup UserProfile.profile_photo via ImageService
    tests/            # test_auth.py, test_single_session.py, test_serializer_image.py
  places/             # Place, Visit, VisitItem
    apps.py           # PlacesConfig.ready() imports places.signals
    signals.py        # post_delete → cleanup Place/Visit/VisitItem photos via ImageService
    tests/            # test_places.py, test_visits.py, test_visit_items.py, test_image_signals.py, test_serializer_images.py
  locale/pt_BR/       # .po/.mo files
```

Endpoints: `/api/auth/{register,login,refresh,logout,me}/` · `/api/places/` · `/api/places/{public_id}/visits/` · `/api/visits/{public_id}/items/` · `/api/media/<path>` · `/api/docs/`

## Image Handling

All image saves go through `core.image_service.ImageService` — never raw Django ImageField save.

**Storage path**: `users/{user_id}/{category}/{sha256[:16]}_{timestamp_ms}` — no extension, non-identifiable.

**Categories by model**:
- `UserProfile.profile_photo` → `profiles`
- `Place.cover_photo` → `places/covers`
- `Visit.photo` → `visits/photos`
- `VisitItem.photo` → `visit_items/photos`

**Encryption**: Fernet symmetric, per-user key derived via `HKDF(SHA256, salt=b"bora-ali-media-v1", info=user_id, ikm=SECRET_KEY)`. Files stored as encrypted blobs regardless of USE_VERSITYGW.

**Serving**: `GET /api/media/<path>` → `serve_user_media` view — authenticates JWT, checks `user_id` matches path prefix `users/{id}/`, decrypts, streams with detected Content-Type. Returns 404 for missing/wrong-user (never 403).

**Serializer pattern**: Write serializers pop the image field from `validated_data`, call `ImageService.save()`, set path on instance. On update, old path deleted before saving new one. On create, save model first, then save image.

**Orphan cleanup**: `post_delete` signals in `accounts/signals.py` and `places/signals.py` call `ImageService.delete()`. Signals registered in `AccountsConfig.ready()` / `PlacesConfig.ready()`.

## Testing

- Pytest + pytest-django. Config: `backend/pytest.ini` → `DJANGO_SETTINGS_MODULE=config.test_settings`
- `config/test_settings.py` — SQLite in-memory, MD5 password hasher (fast), inherits from settings.py
- Tests live in `app/tests/` folders with `__init__.py`
- Fixtures: `model_bakery.baker` for quick instances, `APIRequestFactory` for serializer context
- Image tests need `@override_settings(SECRET_KEY=..., STORAGES={...})` + `tmp_path` + `settings.MEDIA_ROOT = str(tmp_path)`
- Run from `backend/` with venv active: `pytest` / `pytest accounts/` / `pytest -k test_name`

## Worktrees

Directory: `.worktrees/` (project-local, in root `.gitignore`).
Create with: `git worktree add .worktrees/<branch> -b <branch>`

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
