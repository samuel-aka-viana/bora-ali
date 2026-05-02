# Backend: Testes

## Setup

```bash
cd backend
source .venv/bin/activate
pytest           # todos
pytest accounts/ # app específico
pytest -k login  # por nome
```

## Estrutura

```
backend/
  accounts/tests/
    __init__.py
    test_auth.py
    test_single_session.py
    test_serializer_image.py
  places/tests/
    __init__.py
    test_places.py
    test_visits.py
    test_visit_items.py
    test_image_signals.py
  core/tests/
    __init__.py
    test_security.py
    test_image_service.py
    test_media_views.py
```

## Padrão de teste

```python
import pytest
from django.contrib.auth import get_user_model
from model_bakery import baker
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def user(db):
    return baker.make(User, username="tester")

@pytest.fixture
def client_auth(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.mark.django_db
def test_user_sees_only_own_places(client_auth, user):
    other = baker.make(User)
    baker.make("places.Place", user=other)
    mine = baker.make("places.Place", user=user)
    res = client_auth.get("/api/places/")
    assert res.status_code == 200
    ids = [p["public_id"] for p in res.data["results"]]
    assert str(mine.public_id) in ids
    assert len(ids) == 1
```

## O que testar obrigatoriamente

```
auth:
  registro, login, refresh, logout com blacklist
  login Google cria user com is_google_account=True
  sessão única: novo login invalida token anterior
  change_password bloqueado para conta Google

ownership:
  user não vê place de outro
  user não edita place de outro
  user não cria visit em place de outro
  user não cria item em visit de outro

validação:
  rating < 0 rejeitado
  rating > 10 rejeitado
  preço negativo rejeitado
  nome de item obrigatório

imagens:
  upload criptografa no storage
  GET /api/media/ retorna 404 para outro usuário
  delete do model dispara cleanup no storage

paginação:
  listagem retorna count/next/previous/results
  filtro por status funciona
  busca por nome funciona
```

## Testes com imagem (override necessário)

```python
@pytest.mark.django_db
@override_settings(SECRET_KEY="test-secret", STORAGES={"default": {"BACKEND": "django.core.files.storage.FileSystemStorage"}})
def test_image_encrypted(tmp_path, settings):
    settings.MEDIA_ROOT = str(tmp_path)
    # ... test ImageService.save / read
```
