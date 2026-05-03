# Development

## Setup completo (sem Docker)

```bash
# 1. Serviços de infra
docker compose up -d db redis storage jaeger

# 2. Criar bucket no VersityGW (só na primeira vez)
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin
export AWS_DEFAULT_REGION=us-east-1
aws --endpoint-url http://localhost:8081 --region us-east-1 s3api create-bucket --bucket bora-ali
# Não usar `aws s3 mb` — envia LocationConstraint incompatível

# 3. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # http://localhost:8000/api/

# 4. Frontend
cd frontend
npm install
npm run dev  # http://localhost:5173
```

## Variáveis de ambiente

| Modo | Arquivo backend | Arquivo frontend |
|------|----------------|-----------------|
| dev | `backend/.env` (de `.env.dev.example`) | `frontend/.env` (de `.env.development`) |
| preprod (ngrok) | `backend/.env` (de `.env.preprod.example`) | `frontend/.env.preprod` |
| prod | `backend/.env` (de `.env.prod.example`) | `frontend/.env.production` |

**Preprod (ngrok)**: substitua `https://your-ngrok-domain.ngrok-free.dev` em `PUBLIC_BASE_URL`, `AWS_S3_PUBLIC_URL`, `AWS_S3_PUBLIC_ENDPOINT`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` e `VITE_PUBLIC_BASE_URL`. Suba Caddy + ngrok:

```bash
caddy run --config Caddyfile
NGROK_DOMAIN=your-domain.ngrok-free.dev scripts/ngrok-preprod.sh
npm run dev:preprod  # frontend
```

## Comandos úteis

```bash
# Backend (backend/ com venv ativo)
python manage.py makemigrations && python manage.py migrate
python manage.py createsuperuser
python manage.py makemessages -l pt_BR && python manage.py compilemessages
black . && isort . && flake8

# VersityGW — inspecionar storage
aws --endpoint-url http://localhost:8081 --region us-east-1 s3 ls
aws --endpoint-url http://localhost:8081 --region us-east-1 s3 ls s3://bora-ali/
docker compose logs -f storage

# Frontend (frontend/)
npm run dev:local       # bind local explícito
npm run build
npm run lint
```

## Stack full via Docker

```bash
docker compose up -d --build   # sobe tudo (frontend, backend, postgres, redis, VersityGW, Jaeger)
docker compose logs -f backend
docker exec -it bora-ali-backend-1 python manage.py migrate
```

Gunicorn: 3 workers, 2 threads, gthread. Config em `Dockerfile CMD` e `docker-compose.yml` (manter em sincronia). `entrypoint.sh` roda `migrate` + `compilemessages` antes de iniciar (PID 1).

## Observability (OpenTelemetry)

Adicione ao `backend/.env`:
```env
OTEL_SERVICE_NAME=bora-ali
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

Jaeger UI: `http://localhost:16686`. Rastreia requests HTTP, queries SQL (psycopg) e logs correlacionados.

## i18n

- Backend: GNU gettext + `LocaleMiddleware`. `python manage.py makemessages -l pt_BR && compilemessages`
- Frontend: react-i18next. Traduções em `frontend/src/locales/<lang>/translation.json`. Língua em `localStorage.boraali_lang`.

## Visual Identity

- Primary: `#EA1D2C` · Background: `#FAFAFA` · Mobile-first
- Upload de foto: dropzone dashed em PlaceForm, VisitForm e VisitItemForm (click to upload, hover to change, link to remove)
