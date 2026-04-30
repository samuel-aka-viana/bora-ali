
Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
````md
# Skill: Construir MVP Webapp "Bora Ali"

## Objetivo

Implementar um webapp chamado **Bora Ali**.

O Bora Ali é um diário pessoal para registrar lugares que o usuário quer conhecer ou já conheceu, como cafés, restaurantes, docerias, bares e locais similares.

O usuário poderá:

- criar conta;
- fazer login;
- cadastrar lugares;
- registrar visitas;
- avaliar ambiente, atendimento e experiência geral;
- registrar comidas e bebidas pedidas;
- avaliar cada item;
- adicionar observações;
- salvar caminhos de fotos para uso futuro com provider externo;
- filtrar, paginar e consultar histórico.

O projeto começa como site responsivo, mas deve ser estruturado para evoluir futuramente para PWA ou app mobile.

---

# Nome do Projeto

Nome público:

```txt
Bora Ali
````

Nome técnico sugerido:

```txt
bora-ali
bora_ali
```

Usar:

```txt
bora_ali
```

para pacotes Python e nomes internos Django.

---

# Stack Técnica

## Backend

Usar:

```txt
Python
Django
Django REST Framework
PostgreSQL
SimpleJWT
django-filter
django-cors-headers
drf-spectacular
pytest
pytest-django
```

## Frontend

Usar:

```txt
React
Vite
TypeScript
React Router
Tailwind CSS
Vitest
React Testing Library
```

## Banco

Usar:

```txt
PostgreSQL
```

Não usar SQLite como banco principal do projeto.

---

# Arquitetura Geral

```txt
Browser
  |
  v
React SPA
  |
  | HTTP REST JSON
  v
Django REST API
  |
  v
PostgreSQL
```

---

# Princípios Gerais

## Simplicidade

O MVP deve ser simples e fácil de manter.

Não implementar no MVP:

```txt
microserviços
fila
websocket
feed social
curtidas
comentários
ranking público
notificações push
geolocalização automática
Google Places
importação automática do Instagram
pagamento
assinatura
app store
```

## Separação de responsabilidades

Frontend:

```txt
UI
rotas
formulários
estado visual
validação básica
consumo da API
auth guard
testes de componentes
```

Backend:

```txt
autenticação
autorização
models
serializers
viewsets
filters
paginação
validação de domínio
persistência
segurança
rate limit
testes de API
```

---

# Comandos para iniciar o projeto

## Estrutura inicial

```bash
mkdir bora-ali
cd bora-ali

mkdir backend frontend
```

---

# Backend: criação do projeto Django

## Criar ambiente virtual

```bash
cd backend

python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows PowerShell
# .venv\Scripts\Activate.ps1
```

## Instalar dependências

```bash
pip install django djangorestframework psycopg[binary] python-dotenv
pip install djangorestframework-simplejwt django-cors-headers django-filter
pip install drf-spectacular
pip install pytest pytest-django factory-boy model-bakery
pip install black isort flake8
```

## Gerar requirements

```bash
pip freeze > requirements.txt
```

## Criar projeto Django

```bash
django-admin startproject config .
```

## Criar apps

```bash
python manage.py startapp accounts
python manage.py startapp places
```

---

# Backend: dependências esperadas

`requirements.txt` deve conter, no mínimo:

```txt
Django
djangorestframework
djangorestframework-simplejwt
django-cors-headers
django-filter
drf-spectacular
psycopg
python-dotenv
pytest
pytest-django
factory-boy
model-bakery
black
isort
flake8
```

---

# Backend: configuração base

## Apps Django

Adicionar em `config/settings.py`:

```python
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",

    # Local apps
    "accounts",
    "places",
]
```

## Middleware

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

---

# Backend: variáveis de ambiente

Criar `.env.example`:

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=bora_ali
POSTGRES_USER=bora_ali
POSTGRES_PASSWORD=bora_ali
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173

ACCESS_TOKEN_LIFETIME_MINUTES=30
REFRESH_TOKEN_LIFETIME_DAYS=7
```

---

# Backend: PostgreSQL

Configuração esperada:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB"),
        "USER": os.getenv("POSTGRES_USER"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
        "HOST": os.getenv("POSTGRES_HOST"),
        "PORT": os.getenv("POSTGRES_PORT"),
    }
}
```

---

# Docker Compose opcional para PostgreSQL

Criar na raiz do projeto:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: bora_ali_postgres
    environment:
      POSTGRES_DB: bora_ali
      POSTGRES_USER: bora_ali
      POSTGRES_PASSWORD: bora_ali
    ports:
      - "5432:5432"
    volumes:
      - bora_ali_postgres_data:/var/lib/postgresql/data

volumes:
  bora_ali_postgres_data:
```

Subir banco:

```bash
docker compose up -d
```

---

# Backend: Django REST Framework

Configuração base:

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}
```

---

# Backend: autenticação

## Recomendação para MVP

Usar autenticação própria com:

```txt
Django User
SimpleJWT
email/username + senha
```

Endpoints:

```http
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/refresh/
POST /api/auth/logout/
GET  /api/auth/me/
```

## Login com Google

Google OAuth pode ser adicionado depois.

Não implementar Google OAuth no MVP se isso atrasar a entrega básica.

Se implementar futuramente, manter a autenticação centralizada no backend. O frontend nunca deve validar identidade sozinho.

---

# Backend: boas práticas de segurança

## Obrigatório

Implementar:

```txt
JWT com expiração curta
refresh token
blacklist de refresh tokens no logout
CORS restrito
ALLOWED_HOSTS configurado
DEBUG=False em produção
validação de ownership dos dados
paginação em listas
filtros controlados
não expor password hash
não retornar stacktrace em produção
```

## SimpleJWT com blacklist

Adicionar app:

```python
INSTALLED_APPS += [
    "rest_framework_simplejwt.token_blacklist",
]
```

Configuração sugerida:

```python
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

Rodar migrations:

```bash
python manage.py migrate
```

---

# Backend: rate limit e anti-abuso

## Requisito

Adicionar proteção básica contra abuso:

```txt
rate limit por IP
rate limit por usuário autenticado
rate limit específico para login/register
```

## Opção recomendada

Usar throttle nativo do DRF.

Configuração inicial:

```python
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = [
    "rest_framework.throttling.AnonRateThrottle",
    "rest_framework.throttling.UserRateThrottle",
]

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "anon": "100/hour",
    "user": "1000/hour",
    "auth": "10/minute",
}
```

Criar throttle para autenticação:

```python
from rest_framework.throttling import AnonRateThrottle

class AuthRateThrottle(AnonRateThrottle):
    scope = "auth"
```

Aplicar em:

```txt
register
login
refresh
```

## Observação

Isso não é proteção completa contra DDoS.

Para produção real, usar também:

```txt
Cloudflare
WAF
rate limit no reverse proxy
logs
monitoramento
bloqueio por IP em camada de infraestrutura
```

No Django, implementar apenas proteção de aplicação.

---

# Backend: roteamento de chaves e secrets

## Regras

Nunca hardcodar:

```txt
SECRET_KEY
senhas
tokens
credenciais de banco
credenciais de storage
chaves OAuth
```

Sempre usar:

```txt
.env
variáveis de ambiente
secret manager em produção
```

## Rotação

A aplicação deve permitir troca de chaves via variável de ambiente sem alteração de código.

---

# Backend: models

## Padrão obrigatório

Todo model deve conter:

```txt
campos com verbose_name
db_column quando necessário
help_text quando útil
blank/null definidos corretamente
max_length em CharField
DecimalField com max_digits e decimal_places
created_at
updated_at
Meta com db_table
Meta com verbose_name
Meta com verbose_name_plural
Meta com ordering
constraints quando necessário
__str__
```

## Regra de relacionamento

Para relacionamentos 1:N:

```txt
A FK deve ficar no lado N.
```

Exemplo:

```txt
User 1:N Place
Place tem FK para User
```

```txt
Place 1:N Visit
Visit tem FK para Place
```

```txt
Visit 1:N VisitItem
VisitItem tem FK para Visit
```

## Para N:N

Não usar ManyToMany automático se houver chance de atributos extras.

Criar classe intermediária explícita.

Exemplo futuro:

```txt
Group N:N User
```

Criar:

```txt
Group
GroupMember
```

Com:

```txt
GroupMember.user FK User
GroupMember.group FK Group
```

---

# Entidades do MVP

## User

Usar o `User` padrão do Django no MVP.

Não criar custom user agora, a menos que o projeto exija login por email como identificador principal desde o início.

---

## Place

Representa o local.

Campos:

```txt
id
user
name
category
address
instagram_url
maps_url
status
notes
cover_photo_path
created_at
updated_at
```

Observação:

```txt
cover_photo_path salva apenas o caminho da foto.
O upload real será feito futuramente via provider de nuvem.
```

---

## Visit

Representa uma visita ao local.

Campos:

```txt
id
place
visited_at
environment_rating
service_rating
overall_rating
would_return
general_notes
photo_path
created_at
updated_at
```

---

## VisitItem

Representa um item pedido na visita.

Campos:

```txt
id
visit
name
type
rating
price
would_order_again
notes
photo_path
created_at
updated_at
```

---

# Backend: exemplo de models

## places/models.py

```python
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(
        verbose_name="Criado em",
        db_column="created_at",
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        verbose_name="Atualizado em",
        db_column="updated_at",
        auto_now=True,
    )

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


class Place(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="Usuário",
        db_column="user_id",
        related_name="places",
        on_delete=models.CASCADE,
    )
    name = models.CharField(
        verbose_name="Nome",
        db_column="name",
        max_length=160,
    )
    category = models.CharField(
        verbose_name="Categoria",
        db_column="category",
        max_length=80,
        blank=True,
    )
    address = models.CharField(
        verbose_name="Endereço",
        db_column="address",
        max_length=255,
        blank=True,
    )
    instagram_url = models.URLField(
        verbose_name="URL do Instagram",
        db_column="instagram_url",
        max_length=255,
        blank=True,
    )
    maps_url = models.URLField(
        verbose_name="URL do Maps",
        db_column="maps_url",
        max_length=500,
        blank=True,
    )
    status = models.CharField(
        verbose_name="Status",
        db_column="status",
        max_length=30,
        choices=PlaceStatus.choices,
        default=PlaceStatus.WANT_TO_VISIT,
    )
    notes = models.TextField(
        verbose_name="Observações",
        db_column="notes",
        blank=True,
    )
    cover_photo_path = models.CharField(
        verbose_name="Caminho da foto de capa",
        db_column="cover_photo_path",
        max_length=500,
        blank=True,
    )

    class Meta:
        db_table = "places"
        verbose_name = "Lugar"
        verbose_name_plural = "Lugares"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_place_name_per_user",
            )
        ]

    def __str__(self):
        return self.name


class Visit(TimeStampedModel):
    place = models.ForeignKey(
        Place,
        verbose_name="Lugar",
        db_column="place_id",
        related_name="visits",
        on_delete=models.CASCADE,
    )
    visited_at = models.DateField(
        verbose_name="Data da visita",
        db_column="visited_at",
    )
    environment_rating = models.PositiveSmallIntegerField(
        verbose_name="Nota do ambiente",
        db_column="environment_rating",
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    service_rating = models.PositiveSmallIntegerField(
        verbose_name="Nota do atendimento",
        db_column="service_rating",
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    overall_rating = models.PositiveSmallIntegerField(
        verbose_name="Nota geral",
        db_column="overall_rating",
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    would_return = models.BooleanField(
        verbose_name="Voltaria",
        db_column="would_return",
        null=True,
        blank=True,
    )
    general_notes = models.TextField(
        verbose_name="Observações gerais",
        db_column="general_notes",
        blank=True,
    )
    photo_path = models.CharField(
        verbose_name="Caminho da foto",
        db_column="photo_path",
        max_length=500,
        blank=True,
    )

    class Meta:
        db_table = "visits"
        verbose_name = "Visita"
        verbose_name_plural = "Visitas"
        ordering = ["-visited_at", "-created_at"]

    def __str__(self):
        return f"{self.place.name} - {self.visited_at}"


class VisitItem(TimeStampedModel):
    visit = models.ForeignKey(
        Visit,
        verbose_name="Visita",
        db_column="visit_id",
        related_name="items",
        on_delete=models.CASCADE,
    )
    name = models.CharField(
        verbose_name="Nome",
        db_column="name",
        max_length=160,
    )
    type = models.CharField(
        verbose_name="Tipo",
        db_column="type",
        max_length=30,
        choices=VisitItemType.choices,
        default=VisitItemType.OTHER,
    )
    rating = models.PositiveSmallIntegerField(
        verbose_name="Nota",
        db_column="rating",
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    price = models.DecimalField(
        verbose_name="Preço",
        db_column="price",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    would_order_again = models.BooleanField(
        verbose_name="Pediria novamente",
        db_column="would_order_again",
        null=True,
        blank=True,
    )
    notes = models.TextField(
        verbose_name="Observações",
        db_column="notes",
        blank=True,
    )
    photo_path = models.CharField(
        verbose_name="Caminho da foto",
        db_column="photo_path",
        max_length=500,
        blank=True,
    )

    class Meta:
        db_table = "visit_items"
        verbose_name = "Item da visita"
        verbose_name_plural = "Itens da visita"
        ordering = ["created_at"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gte=0) | models.Q(price__isnull=True),
                name="visit_item_price_gte_zero",
            )
        ]

    def __str__(self):
        return self.name
```

---

# Backend: serializers

## Padrão

Usar serializers explícitos.

Criar:

```txt
RegisterSerializer
UserSerializer
PlaceListSerializer
PlaceDetailSerializer
PlaceWriteSerializer
VisitSerializer
VisitWriteSerializer
VisitItemSerializer
```

## Regras

```txt
Não expor user editável diretamente no PlaceWriteSerializer.
user deve vir de request.user.
Não permitir criar Visit para Place de outro usuário.
Não permitir criar VisitItem para Visit de outro usuário.
```

---

# Backend: viewsets

## Padrão obrigatório

Usar:

```txt
ModelViewSet
GenericViewSet
mixins quando necessário
```

Evitar views soltas sem necessidade.

## Places

Endpoints:

```http
GET    /api/places/
POST   /api/places/
GET    /api/places/{id}/
PATCH  /api/places/{id}/
DELETE /api/places/{id}/
```

Deve ter:

```txt
paginação
filtro por status
busca por nome/categoria/endereço
ordenação
queryset filtrado por request.user
```

Filtros:

```http
/api/places/?status=visited
/api/places/?search=cafe
/api/places/?ordering=name
/api/places/?ordering=-updated_at
```

## Visits

Endpoints:

```http
POST   /api/places/{place_id}/visits/
PATCH  /api/visits/{id}/
DELETE /api/visits/{id}/
```

## VisitItems

Endpoints:

```http
POST   /api/visits/{visit_id}/items/
PATCH  /api/visit-items/{id}/
DELETE /api/visit-items/{id}/
```

---

# Backend: paginação

Toda listagem deve ser paginada.

Formato padrão DRF:

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/places/?page=2",
  "previous": null,
  "results": []
}
```

Não retornar listas grandes sem paginação.

---

# Backend: filters

Usar `django-filter`.

Criar `places/filters.py`.

Filtros mínimos:

```txt
PlaceFilter
- status
- category
- created_at
- updated_at

VisitFilter
- visited_at
- would_return
- overall_rating

VisitItemFilter
- type
- rating
- would_order_again
```

---

# Backend: permissions

Criar permissões ou filtrar corretamente o queryset.

Regra mínima:

```python
def get_queryset(self):
    return Place.objects.filter(user=self.request.user)
```

Para Visit:

```python
def get_queryset(self):
    return Visit.objects.filter(place__user=self.request.user)
```

Para VisitItem:

```python
def get_queryset(self):
    return VisitItem.objects.filter(visit__place__user=self.request.user)
```

---

# Backend: admin

Registrar:

```txt
Place
Visit
VisitItem
```

Configurar:

```txt
list_display
list_filter
search_fields
readonly_fields
```

---

# Backend: rotas

## config/urls.py

```python
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("places.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
```

---

# Backend: testes obrigatórios

Usar:

```txt
pytest
pytest-django
APIClient
model-bakery ou factory-boy
```

Testar:

```txt
registro de usuário
login
refresh token
logout com blacklist
usuário autenticado cria place
usuário não autenticado não cria place
usuário não vê place de outro usuário
usuário não edita place de outro usuário
usuário cria visit apenas em place próprio
usuário cria item apenas em visit própria
rating menor que 0 é rejeitado
rating maior que 10 é rejeitado
preço negativo é rejeitado
listagem de places é paginada
filtro por status funciona
busca por nome funciona
```

Comandos:

```bash
pytest
```

---

# Frontend: criação do projeto

## Criar Vite React

```bash
cd ../frontend

npm create vite@latest . -- --template react-ts
npm install
```

## Instalar dependências

```bash
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Inicializar Tailwind

```bash
npx tailwindcss init -p
```

---

# Frontend: identidade visual

A UI deve ter uma identidade própria, moderna, agradável e inspirada em apps de comida.

Referência visual geral:

```txt
estilo limpo
cards arredondados
botões arredondados
tons fortes para ações principais
layout mobile-first
hierarquia visual clara
parecido em sensação com apps como iFood, mas sem copiar marca, logo ou elementos proprietários
```

## Direção visual

Usar:

```txt
bordas arredondadas
cards com sombra leve
botões grandes
espaçamento confortável
fundo claro
ações principais em cor quente/vermelha
feedback visual de status
```

## Cores sugeridas

Não copiar exatamente identidade de terceiros.

Sugestão para Bora Ali:

```txt
primary: #EA1D2C
primary-dark: #B91422
background: #FAFAFA
surface: #FFFFFF
text: #1F2937
muted: #6B7280
border: #E5E7EB
success: #16A34A
warning: #F59E0B
danger: #DC2626
```

## Componentes

Criar componentes reutilizáveis:

```txt
Button
Input
Textarea
Select
Card
Badge
RatingInput
PageHeader
EmptyState
LoadingState
ErrorMessage
```

---

# Frontend: AuthGuard

Obrigatório implementar proteção de rotas.

## Comportamento

```txt
Usuário sem token não acessa rotas privadas.
Usuário sem token deve ser redirecionado para /login.
Usuário autenticado não deve voltar para /login sem logout.
Token expirado deve causar logout ou tentativa de refresh.
```

## Rotas públicas

```txt
/login
/register
```

## Rotas privadas

```txt
/
/places
/places/new
/places/:id
/places/:id/edit
/places/:id/visits/new
/visits/:id/edit
```

## AuthGuard esperado

Criar:

```txt
components/ProtectedRoute.tsx
components/PublicRoute.tsx
```

---

# Frontend: segurança

## Boas práticas

```txt
não armazenar dados sensíveis além dos tokens necessários
não expor secrets no frontend
usar VITE_API_URL por variável de ambiente
validar inputs
sanitizar saída quando necessário
não usar dangerouslySetInnerHTML
tratar 401 globalmente
fazer logout ao receber 401 inválido
usar HTTPS em produção
```

## Tokens

Para MVP:

```txt
access token e refresh token podem ficar em localStorage
```

Observação:

```txt
Para produção mais robusta, avaliar cookie HttpOnly via backend.
```

---

# Frontend: estrutura

```txt
frontend/
  src/
    main.tsx
    App.tsx

    routes/
      LoginPage.tsx
      RegisterPage.tsx
      PlacesPage.tsx
      NewPlacePage.tsx
      EditPlacePage.tsx
      PlaceDetailPage.tsx
      NewVisitPage.tsx
      EditVisitPage.tsx

    components/
      ui/
        Button.tsx
        Input.tsx
        Textarea.tsx
        Select.tsx
        Card.tsx
        Badge.tsx
      auth/
        ProtectedRoute.tsx
        PublicRoute.tsx
      places/
        PlaceCard.tsx
        PlaceForm.tsx
      visits/
        VisitCard.tsx
        VisitForm.tsx
        VisitItemForm.tsx
      feedback/
        EmptyState.tsx
        LoadingState.tsx
        ErrorMessage.tsx

    services/
      api.ts
      auth.service.ts
      places.service.ts
      visits.service.ts
      visit-items.service.ts

    types/
      user.ts
      place.ts
      visit.ts
      visit-item.ts

    utils/
      constants.ts
      formatters.ts
      validators.ts

    test/
      setup.ts
```

---

# Frontend: rotas

```txt
/login
/register
/places
/places/new
/places/:id
/places/:id/edit
/places/:id/visits/new
/visits/:id/edit
```

Rota `/`:

```txt
se autenticado -> /places
se não autenticado -> /login
```

---

# Frontend: API client

Criar `services/api.ts`.

Requisitos:

```txt
baseURL por VITE_API_URL
adicionar Authorization: Bearer token
interceptor para 401
refresh token se implementado
logout se refresh falhar
```

`.env.example`:

```env
VITE_API_URL=http://localhost:8000/api
```

---

# Frontend: telas

## LoginPage

Campos:

```txt
username
password
```

Ações:

```txt
login
ir para cadastro
```

## RegisterPage

Campos:

```txt
username
email
password
confirm_password
```

Ações:

```txt
cadastrar
ir para login
```

## PlacesPage

Elementos:

```txt
header com Bora Ali
botão Novo lugar
filtros por status
campo de busca
lista paginada
estado vazio
loading
erro
```

## NewPlacePage / EditPlacePage

Campos:

```txt
name
category
address
instagram_url
maps_url
status
notes
cover_photo_path
```

## PlaceDetailPage

Mostrar:

```txt
dados do lugar
status
links
notas
histórico de visitas
itens de cada visita
botão adicionar visita
botão editar
botão excluir
```

## NewVisitPage / EditVisitPage

Campos:

```txt
visited_at
environment_rating
service_rating
overall_rating
would_return
general_notes
photo_path
items
```

Itens:

```txt
name
type
rating
price
would_order_again
notes
photo_path
```

---

# Frontend: testes obrigatórios

Usar:

```txt
Vitest
React Testing Library
Testing Library User Event
```

Testar:

```txt
LoginPage renderiza campos
RegisterPage renderiza campos
ProtectedRoute redireciona usuário sem token
PublicRoute redireciona usuário autenticado
PlaceCard renderiza dados principais
PlaceForm exige nome
RatingInput não permite valor fora de 0 a 10
PlacesPage exibe estado vazio
PlacesPage exibe lista de lugares
API client adiciona Authorization header
```

Comando:

```bash
npm run test
```

---

# Frontend: scripts esperados

`package.json` deve conter:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint ."
  }
}
```

---

# Backend: comandos úteis

## Rodar migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## Criar superusuário

```bash
python manage.py createsuperuser
```

## Rodar servidor

```bash
python manage.py runserver
```

## Rodar testes

```bash
pytest
```

---

# Frontend: comandos úteis

## Rodar frontend

```bash
npm run dev
```

## Rodar testes

```bash
npm run test
```

## Build

```bash
npm run build
```

---

# Critérios de aceite do MVP

O MVP só é considerado funcional se:

```txt
usuário consegue se cadastrar
usuário consegue logar
rota privada bloqueia usuário sem login
usuário consegue criar lugar
usuário consegue listar lugares paginados
usuário consegue filtrar lugares por status
usuário consegue ver detalhe de um lugar
usuário consegue criar visita
usuário consegue criar item pedido
usuário não acessa dados de outro usuário
ratings inválidos são rejeitados
preço negativo é rejeitado
logout invalida refresh token
backend possui testes mínimos
frontend possui testes mínimos
```

---

# Decisões importantes

## Autenticação

Usar autenticação própria no backend com SimpleJWT no MVP.

Google Auth é opcional para fase futura.

## Fotos

No MVP, não fazer upload.

Salvar apenas:

```txt
cover_photo_path
photo_path
```

Esses campos receberão o caminho/URL gerado por provider externo no futuro.

## Permissões

Todos os dados são privados por usuário.

Não criar grupos no MVP.

## Paginação

Toda listagem deve usar paginação do DRF.

Nunca retornar todos os registros sem limite.

## Segurança

Aplicar:

```txt
JWT
blacklist
rate limit
CORS restrito
ownership checks
env vars
não expor secrets
não expor senha
```

---

# Fases futuras

## Fase 2

```txt
PWA
upload real de fotos
provider S3/R2/Supabase Storage
melhor dashboard
busca avançada
tags
```

## Fase 3

```txt
grupos
convites
compartilhamento entre usuários
recomendações
```

## Fase 4

```txt
app mobile
publicação Android/iOS
login social
mapa
geolocalização
```
