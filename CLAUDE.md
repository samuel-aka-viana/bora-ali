# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bora Ali** is a personal diary webapp for tracking places (cafés, restaurants, bars, etc.) the user wants to visit or has visited. Users can register visits, rate environment/service/experience, log ordered items, and browse their history.

The full MVP specification lives in `skills.md`.

## Architecture

```
Browser → React SPA (frontend/) → Django REST API (backend/) → PostgreSQL
```

- **backend/**: Django + Django REST Framework + SimpleJWT + PostgreSQL
- **frontend/**: React + Vite + TypeScript + Tailwind CSS
- **docker-compose.yml**: PostgreSQL only (app servers run locally)

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

## Database

PostgreSQL via Docker Compose (no SQLite):

```bash
docker compose up -d   # start postgres
```

Credentials from `.env` (see `.env.example` in backend/).

## Key Design Decisions

**Data model hierarchy**: `User → Place → Visit → VisitItem`. All FKs sit on the "many" side. Ratings are 0–10 integers. `cover_photo_path` / `photo_path` store file paths only — no uploads in MVP.

**Ownership enforcement**: Every queryset filters by `request.user`. Never return data from other users.
- `Place`: `filter(user=request.user)`
- `Visit`: `filter(place__user=request.user)`
- `VisitItem`: `filter(visit__place__user=request.user)`

**Auth**: SimpleJWT with `ROTATE_REFRESH_TOKENS=True` and `BLACKLIST_AFTER_ROTATION=True`. Logout must blacklist the refresh token.

**Rate limiting**: DRF throttle — `auth` scope at 10/minute on register/login/refresh endpoints.

**API shape**: REST JSON with DRF `PageNumberPagination` (PAGE_SIZE=20). All list endpoints must be paginated.

## Backend App Structure

```
backend/
  config/          # Django project (settings, urls, wsgi)
  accounts/        # User auth: register, login, refresh, logout, me
  places/          # Place, Visit, VisitItem models, serializers, viewsets, filters
```

Auth endpoints: `/api/auth/{register,login,refresh,logout,me}/`  
Places endpoints: `/api/places/`, `/api/places/{id}/visits/`, `/api/visits/{id}/items/`  
API docs: `/api/docs/` (drf-spectacular Swagger UI)

## Frontend Structure

```
frontend/src/
  routes/          # Page components (LoginPage, PlacesPage, PlaceDetailPage, etc.)
  components/
    ui/            # Button, Input, Card, Badge, RatingInput, etc.
    auth/          # ProtectedRoute, PublicRoute
    places/        # PlaceCard, PlaceForm
    visits/        # VisitCard, VisitForm, VisitItemForm
    feedback/      # EmptyState, LoadingState, ErrorMessage
  services/        # api.ts (axios client), auth/places/visits/visit-items services
  types/           # TypeScript interfaces mirroring backend models
  utils/           # constants, formatters, validators
```

`services/api.ts` must add `Authorization: Bearer <token>` to all requests and handle 401 globally (attempt refresh → logout on failure). API base URL comes from `VITE_API_URL` env var.

## Visual Identity

Primary color `#EA1D2C`, background `#FAFAFA`, mobile-first layout. Cards with rounded corners and light shadow. No social features, no maps integration, no file uploads — these are Phase 2+.

## What NOT to Build in MVP

microservices, queues, websockets, social feeds, likes, geolocation, Google Places, Instagram import, payments, PWA, app store, Google OAuth.
