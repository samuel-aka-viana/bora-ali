# Arquitetura

## Diagrama

```mermaid
graph TB
    subgraph Client["Cliente"]
        Browser["🌐 Browser\nReact + Vite + TS\nTailwind CSS"]
    end

    subgraph Edge["Edge (Produção)"]
        CF["☁️ Cloudflare\nProxy + DDoS + SSL\nCache de assets"]
    end

    subgraph VPS["VPS Contabo (2 vCPU / 4 GB)"]
        Nginx["🔀 nginx\nReverse proxy + gzip\nCache headers"]
        Gunicorn["⚙️ Gunicorn\n3 workers / 2 threads\ngthread"]
        Redis["⚡ Redis\nCache de sessão\n128 MB"]
    end

    subgraph Data["Dados"]
        DB["🗄️ PostgreSQL\nUser → Place → Visit → VisitItem"]
        Storage["🪣 VersityGW / R2\nFotos criptografadas\nS3-compatible"]
        Jaeger["📊 Jaeger\nOpenTelemetry Traces"]
    end

    Browser -->|HTTPS| CF
    CF -->|HTTP| Nginx
    Nginx -->|/api/| Gunicorn
    Gunicorn <-->|session cache| Redis
    Gunicorn -->|SQL + CONN_MAX_AGE=60| DB
    Gunicorn -->|S3 API| Storage
    Gunicorn -->|OTLP| Jaeger
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| Backend | Django 5 + Django REST Framework + SimpleJWT |
| Cache | Redis 7 (session cache, throttling) |
| Database | PostgreSQL 16 (local) → Supabase (produção) |
| Storage | VersityGW (local) → Cloudflare R2 (produção) |
| Observability | Jaeger + OpenTelemetry + Sentry |
| Auth | JWT com refresh rotation + single-session por usuário |
| Servidor | Gunicorn gthread (3w × 2t) atrás de nginx |
| Testing | pytest + Vitest + Playwright |

## Modelo de Dados

```
User
 └── Place (name, description, address, status, cover_photo, maps_url, lat/lng)
      └── Visit (date, rating_env, rating_service, rating_exp, photo, notes)
           └── VisitItem (name, type, price, rating, photo, description)
```

- `id` = PK interno (FK joins). `public_id` = UUID exposto em todas URLs/payloads.
- Ratings: escala 0–10 (inteiros).
- Status do lugar: `want` / `visited` / `favorite` / `wont_return`.
- Paginação: 20 itens/página em todos os list endpoints.

## Autenticação

- SimpleJWT com `ROTATE_REFRESH_TOKENS=True`. Logout blacklista o refresh token.
- Tokens em `localStorage` (tradeoff aceito: XSS vs CSRF). TTL access=30min.
- **Single-session**: `UserSession` por usuário com `session_key` rotativo no JWT, validado por `SingleSessionJWTAuthentication`. Novo login invalida sessão anterior.
- Redis cache do `session_key` com TTL=270s — evita DB hit em cada request autenticado.
- Password hashing: Argon2 primeiro, PBKDF2 como fallback (re-hash transparente no próximo login).
- **Throttle**: login/register/me usam `AuthRateThrottle` (scope `auth`, 10/min). CIDRs privados isentos via `THROTTLE_EXEMPT_CIDRS`.
- Google OAuth: `POST /api/auth/google/` com `{ id_token }`. Troca de senha bloqueada para contas Google.

## Imagens

- Salvas via `core.image_service.ImageService` — nunca direto no ImageField.
- Path: `users/{user_id}/{category}/{sha256[:16]}_{timestamp_ms}` (sem extensão, não identificável).
- Criptografia Fernet por usuário: `HKDF(SHA256, salt=b"bora-ali-media-v1", info=user_id, ikm=SECRET_KEY)`.
- Servidas em `GET /api/media/<path>` — autentica JWT, confere `user_id` no path, descriptografa, stream. Retorna 404 para arquivo errado ou de outro usuário (nunca 403).
- `post_delete` signals em `accounts/signals.py` e `places/signals.py` chamam `ImageService.delete()`.

## Estrutura de Arquivos

```
bora-ali/
├── backend/
│   ├── config/         # settings.py, urls.py, wsgi.py, telemetry.py, test_settings.py
│   ├── core/           # utilitários compartilhados (não em INSTALLED_APPS)
│   │   ├── exceptions.py / exception_handler.py
│   │   ├── validators.py       # validate_image_upload(), validate_safe_url()
│   │   ├── image_service.py    # ImageService
│   │   └── media_views.py      # serve_user_media
│   ├── accounts/       # UserSession, UserProfile, SingleSessionJWTAuthentication
│   │   ├── authentication.py
│   │   └── throttles.py        # AuthRateThrottle
│   ├── places/         # Place, Visit, VisitItem
│   │   └── managers.py         # QuerySets com select_related
│   └── entrypoint.sh   # migrate + compilemessages → exec gunicorn (PID 1)
├── frontend/
│   └── src/
│       ├── routes/     # LoginPage, RegisterPage, PlacesPage, PlaceDetailPage, ...
│       ├── components/ # ui/, places/, visits/
│       ├── services/   # api.ts, api-errors.ts, auth/places/visits/visit-items.service.ts
│       └── contexts/   # AuthContext
├── docs/
│   ├── superpowers/    # planos de implementação (uso interno)
│   ├── architecture.md
│   ├── development.md
│   └── testing.md
├── scripts/
│   └── test_nginx_security.sh
├── docker-compose.yml
├── CLAUDE.md
└── README.md
```

## Docker Compose — Serviços

| Serviço | URL local | Notas |
|---------|-----------|-------|
| Frontend (nginx) | `http://localhost` | SPA + proxy `/api/` |
| API | `http://localhost/api/` | Django via nginx |
| Health check | `http://localhost/api/health/` | sem auth, sem DB |
| PostgreSQL | `localhost:5432` | — |
| Redis | `localhost:6379` | — |
| Jaeger UI | `http://localhost:16686` | traces OTLP |
| VersityGW S3 API | `http://localhost:8081` | `AccessDenied` na raiz é esperado |
| VersityGW WebGUI | `http://localhost:8082` | — |

**Profile `security`** (não sobe por padrão): `zap-api-scan`, `zap-baseline`, `httpx-security`.
```bash
docker compose --profile security run --rm zap-api-scan
```
