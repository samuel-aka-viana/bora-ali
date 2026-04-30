# 📍 Bora Ali

Um webapp de diário pessoal para rastrear lugares (cafés, restaurantes, bares, etc.) que você quer visitar ou visitou. Registre suas visitas, avalie ambiente/serviço/experiência, registre itens pedidos e navegue seu histórico.

## 🎯 Visão Geral

**Bora Ali** ajuda você a:
- ✅ Catalogar lugares que quer visitar ou já visitou
- ⭐ Avaliar ambiente, serviço e experiência geral
- 📸 Registrar itens que comeu ou bebeu
- 📚 Manter um histórico pessoal de suas experiências

## 🏗️ Arquitetura

```mermaid
graph TB
    subgraph Frontend["Frontend"]
        Browser["🌐 Browser<br/>React + Vite + TS<br/>Tailwind CSS"]
    end
    
    subgraph Backend["Backend"]
        API["🔌 Django REST API<br/>DRF + SimpleJWT"]
    end
    
    subgraph Database["Data & Observability"]
        DB["🗄️ PostgreSQL<br/>User → Place → Visit → VisitItem"]
        Jaeger["📊 Jaeger<br/>OpenTelemetry Traces"]
    end
    
    Browser -->|HTTP/REST| API
    API -->|SQL| DB
    API -->|OTLP| Jaeger
    
    style Browser fill:#61dafb,stroke:#333,color:#000
    style API fill:#092e20,stroke:#333,color:#fff
    style DB fill:#336791,stroke:#333,color:#fff
    style Jaeger fill:#13b9fd,stroke:#333,color:#fff
```

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS |
| **Backend** | Django 5 + Django REST Framework + SimpleJWT |
| **Database** | PostgreSQL 16 |
| **Observability** | Jaeger + OpenTelemetry |
| **Auth** | JWT com refresh token rotation |
| **Testing** | pytest (backend) + Vitest (frontend) |

## 🚀 Quick Start

### Pré-requisitos

- Python 3.8+
- Node.js 18+
- Docker & Docker Compose

### 1️⃣ Clonar o projeto

```bash
git clone <repository-url>
cd bora-ali
```

### 2️⃣ Iniciar serviços (PostgreSQL + Jaeger)

```bash
docker compose up -d
```

Isso inicia:
- **PostgreSQL**: porta `5432`
- **Jaeger UI**: `http://localhost:16686`

### 3️⃣ Configurar Backend

```bash
cd backend

# Criar virtualenv
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env

# Executar migrações
python manage.py migrate

# (Opcional) Criar superuser
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

API estará em: `http://localhost:8000/api/`  
Docs Swagger: `http://localhost:8000/api/docs/`

### 4️⃣ Configurar Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

Aplicação estará em: `http://localhost:5173`

## 📁 Estrutura do Projeto

```
bora-ali/
├── backend/                      # Django REST API
│   ├── config/                   # Configurações do projeto
│   │   ├── settings.py           # Django settings
│   │   ├── urls.py               # Rotas principais
│   │   ├── wsgi.py               # WSGI para produção
│   │   └── telemetry.py          # OpenTelemetry setup
│   ├── accounts/                 # Autenticação e usuários
│   │   ├── models.py             # User model (Django built-in)
│   │   ├── serializers.py        # Auth serializers
│   │   ├── views.py              # Auth viewsets
│   │   └── urls.py               # Auth endpoints
│   ├── places/                   # Lógica de lugares, visitas, itens
│   │   ├── models.py             # Place, Visit, VisitItem
│   │   ├── serializers.py        # Serializers para API
│   │   ├── viewsets.py           # ViewSets REST
│   │   ├── filters.py            # Filtros customizados
│   │   └── urls.py               # Places endpoints
│   ├── manage.py                 # Django CLI
│   ├── requirements.txt           # Dependências Python
│   └── .env.example               # Variáveis de exemplo
│
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── routes/               # Páginas principais
│   │   │   ├── LoginPage.tsx      # Autenticação
│   │   │   ├── PlacesPage.tsx     # Lista de lugares
│   │   │   ├── PlaceDetailPage.tsx # Detalhes de lugar
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── ui/               # Componentes reutilizáveis
│   │   │   ├── auth/             # Protected/Public routes
│   │   │   ├── places/           # Componentes de lugares
│   │   │   ├── visits/           # Componentes de visitas
│   │   │   └── feedback/         # Loading, Empty, Error states
│   │   ├── services/
│   │   │   ├── api.ts            # Axios client com interceptadores
│   │   │   ├── auth.ts           # Auth service
│   │   │   └── places.ts         # Places service
│   │   ├── types/                # TypeScript interfaces
│   │   ├── utils/                # Constantes, formatters, validators
│   │   └── App.tsx               # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                         # Documentação adicional
├── docker-compose.yml            # Orquestração de serviços
├── Caddyfile                     # Reverse proxy (produção)
├── CLAUDE.md                     # Guia para LLM
├── skills.md                     # Especificação MVP detalhada
└── README.md                     # Este arquivo
```

## 🔐 Autenticação

A API usa **SimpleJWT** com refresh token rotation:

- **Register**: `POST /api/auth/register/`
- **Login**: `POST /api/auth/login/`
- **Refresh Token**: `POST /api/auth/refresh/`
- **Logout**: `POST /api/auth/logout/` (blacklista o token)
- **Meu Perfil**: `GET /api/auth/me/`

Todos os requests autenticados incluem o header:
```
Authorization: Bearer <access_token>
```

Rate limit: **10 requisições/minuto** em endpoints de auth.

## 📊 Modelo de Dados

```
┌─────────────┐
│    User     │
│  (Django)   │
└──────┬──────┘
       │ 1:N
       │
       ▼
┌──────────────────┐
│      Place       │ (name, description, address, rating)
│   user_id (FK)   │
└──────┬───────────┘
       │ 1:N
       │
       ▼
┌──────────────────┐
│      Visit       │ (date, rating_env, rating_service, rating_exp)
│  place_id (FK)   │
└──────┬───────────┘
       │ 1:N
       │
       ▼
┌──────────────────┐
│    VisitItem     │ (description, price)
│   visit_id (FK)  │
└──────────────────┘
```

### Regras Importantes

- ✅ **Propriedade**: Cada usuário só vê seus próprios dados
- ✅ **Ratings**: Escala 0-10 (inteiros)
- ✅ **Fotos**: Armazenam apenas caminhos (MVP não tem upload)
- ✅ **Paginação**: Todos os endpoints de lista retornam 20 itens/página

## 🛠️ Comandos Essenciais

### Backend

```bash
cd backend
source .venv/bin/activate

# Servidor de desenvolvimento
python manage.py runserver

# Migrações
python manage.py makemigrations
python manage.py migrate

# Testes
pytest                    # Todos
pytest accounts/          # App específico
pytest -k test_name       # Teste específico

# Qualidade de código
black .                   # Formatter
isort .                   # Organiza imports
flake8                    # Linter
```

### Frontend

```bash
cd frontend

# Dev server (com hot reload)
npm run dev

# Build para produção
npm run build

# Executar testes
npm run test
npm run test:watch       # Watch mode

# Lint
npm run lint

# E2E (Playwright)
npm run test:e2e
```

## 📡 OpenTelemetry (Observability)

Para ativar tracing, adicione ao `backend/.env`:

```env
OTEL_SERVICE_NAME=bora-ali
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

O sistema rastreia automaticamente:
- ✅ Requests HTTP (Django)
- ✅ Queries SQL (psycopg)
- ✅ Logs correlacionados

**Jaeger UI**: `http://localhost:16686`

## 🎨 Visual Identity

- **Cor primária**: `#EA1D2C` (vermelho)
- **Background**: `#FAFAFA` (branco off)
- **Layout**: Mobile-first
- **Cards**: Rounded corners + light shadow

## 📚 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register/` | Registrar novo usuário |
| POST | `/api/auth/login/` | Login (retorna access + refresh token) |
| POST | `/api/auth/refresh/` | Renovar access token |
| POST | `/api/auth/logout/` | Logout (blacklista refresh token) |
| GET | `/api/auth/me/` | Dados do usuário autenticado |

### Lugares

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/places/` | Listar meus lugares |
| POST | `/api/places/` | Criar novo lugar |
| GET | `/api/places/{id}/` | Detalhes de um lugar |
| PUT | `/api/places/{id}/` | Editar lugar |
| DELETE | `/api/places/{id}/` | Deletar lugar |
| GET | `/api/places/{id}/visits/` | Listar visitas de um lugar |

### Visitas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/places/{id}/visits/` | Registrar visita em um lugar |
| GET | `/api/visits/{id}/` | Detalhes de uma visita |
| PUT | `/api/visits/{id}/` | Editar visita |
| DELETE | `/api/visits/{id}/` | Deletar visita |

### Itens de Visita

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/visits/{id}/items/` | Listar itens de uma visita |
| POST | `/api/visits/{id}/items/` | Criar item (comida/bebida) |
| PUT | `/api/visits/{visit_id}/items/{item_id}/` | Editar item |
| DELETE | `/api/visits/{visit_id}/items/{item_id}/` | Deletar item |

## 🧪 Testes

### Backend

```bash
cd backend
source .venv/bin/activate

# Rodar todos os testes
pytest

# Com cobertura
pytest --cov=.

# Apenas um arquivo/módulo
pytest accounts/tests/test_auth.py

# Modo verbose
pytest -v
```

### Frontend

```bash
cd frontend

# Rodar testes uma vez
npm run test

# Watch mode
npm run test:watch

# Cobertura
npm run test -- --coverage
```

## 📦 Deployment

O projeto inclui `Caddyfile` para produção com reverse proxy. Consulte documentação adicional em `docs/`.

## ❌ Fora do MVP

Os seguintes não serão implementados nesta fase:

- ❌ Microserviços
- ❌ Filas/Workers assíncronos
- ❌ WebSockets
- ❌ Redes sociais (likes, comments, seguir)
- ❌ Geolocalização
- ❌ Google Places API
- ❌ Upload de arquivos
- ❌ Integração Instagram
- ❌ Pagamentos
- ❌ PWA
- ❌ App stores
- ❌ OAuth (Google, Facebook)

## 📖 Documentação Adicional

- **`CLAUDE.md`**: Guia para desenvolvimento com IA
- **`skills.md`**: Especificação completa do MVP

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/minha-feature`
2. Faça commit das mudanças: `git commit -am 'Add minha feature'`
3. Push para a branch: `git push origin feature/minha-feature`
4. Abra um Pull Request

---

**Desenvolvido com ❤️**
