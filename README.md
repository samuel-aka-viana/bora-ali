# 📍 Bora Ali

Diário pessoal de lugares — cafés, restaurantes, bares. Catalogue, avalie, registre visitas e itens pedidos.

**Stack**: Django + DRF + SimpleJWT + PostgreSQL + Redis · React + Vite + TypeScript + Tailwind · nginx · VersityGW (S3) · Jaeger

→ [Arquitetura & modelo de dados](docs/architecture.md) · [Guia de desenvolvimento](docs/development.md) · [Testes](docs/testing.md)

---

## Quick Start

### Pré-requisitos

- Python 3.8+ · Node.js 18+ · Docker & Docker Compose

### 1. Clonar e configurar .env

```bash
git clone <repository-url> && cd bora-ali
cp backend/.env.dev.example backend/.env
cp frontend/.env.development frontend/.env
```

### 2. Subir infra + criar bucket

```bash
docker compose up -d db redis storage jaeger

export AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin AWS_DEFAULT_REGION=us-east-1
aws --endpoint-url http://localhost:8081 --region us-east-1 s3api create-bucket --bucket bora-ali
```

### 3. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API: `http://localhost:8000/api/` · Docs: `http://localhost:8000/api/docs/`

### 4. Frontend

```bash
cd frontend && npm install && npm run dev
```

App: `http://localhost:5173`

### Alternativa: stack completa via Docker

```bash
docker compose up -d --build   # frontend em http://localhost
```

---

## Endpoints da API

### Auth

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register/` | Registrar |
| POST | `/api/auth/login/` | Login → access + refresh token |
| POST | `/api/auth/refresh/` | Renovar access token |
| POST | `/api/auth/logout/` | Logout (blacklista refresh) |
| GET | `/api/auth/me/` | Dados do usuário autenticado |
| POST | `/api/auth/google/` | Login com Google (`{ id_token }`) |

### Lugares / Visitas / Itens

| Método | Endpoint |
|--------|----------|
| GET/POST | `/api/places/` |
| GET/PATCH/DELETE | `/api/places/{public_id}/` |
| GET/POST | `/api/places/{public_id}/visits/` |
| GET/PATCH/DELETE | `/api/visits/{public_id}/` |
| GET/POST | `/api/visits/{public_id}/items/` |
| PATCH/DELETE | `/api/visits/{public_id}/items/{public_id}/` |
| GET | `/api/media/{path}` — imagem descriptografada (JWT obrigatório) |

Paginação: 20 itens/página. Todos os recursos filtrados por `request.user`.

---

## Deployment

### Stack de produção

```
GoDaddy (domínio) → Cloudflare (proxy / DDoS / SSL)
  → Contabo VPS (2 vCPU / 4 GB)
      ├── nginx · Gunicorn (3w × 2t) · Redis · Sentry
  → Supabase (PostgreSQL via PgBouncer :6543)
  → Cloudflare R2 (storage de fotos)
```

### Checklist antes de subir

- [ ] `DJANGO_SECRET_KEY` 50+ chars
- [ ] `DJANGO_DEBUG=False` (já é o default)
- [ ] `POSTGRES_PORT=6543` (PgBouncer Supabase)
- [ ] `PUBLIC_BASE_URL` com domínio real
- [ ] Cloudflare: SSL Full Strict, Page Rule `/api/*` → Bypass Cache
- [ ] `REDIS_URL` apontando para Redis do VPS
- [ ] `GOOGLE_OAUTH_CLIENT_ID` + `VITE_GOOGLE_OAUTH_CLIENT_ID` (se usar OAuth)

---

**Fora do escopo**: microservices, queues, websockets, social feeds, payments, PWA, Facebook/Apple OAuth.
