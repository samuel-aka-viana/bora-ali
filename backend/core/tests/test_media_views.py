import io

import pytest
from core.image_service import ImageService
from django.test import override_settings
from model_bakery import baker
from PIL import Image


def make_jpeg_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color=(0, 255, 0)).save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


@pytest.fixture
def auth_client(client, django_user_model):
    user = baker.make(django_user_model, username="alice")
    user.set_password("pass")
    user.save()
    resp = client.post(
        "/api/auth/login/",
        {"username": "alice", "password": "pass"},
        content_type="application/json",
    )
    token = resp.json()["access"]
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    client._user = user
    return client


@pytest.fixture
def other_client(django_user_model):
    from django.test import Client

    c = Client()
    user = baker.make(django_user_model, username="bob")
    user.set_password("pass")
    user.save()
    resp = c.post(
        "/api/auth/login/",
        {"username": "bob", "password": "pass"},
        content_type="application/json",
    )
    token = resp.json()["access"]
    c.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    c._user = user
    return c


@pytest.mark.django_db
@override_settings(
    SECRET_KEY="test-secret-key-long-enough-for-hkdf-derivation-1234",
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    },
)
def test_serve_own_file_returns_200(auth_client, tmp_path, settings):
    settings.MEDIA_ROOT = str(tmp_path)
    user = auth_client._user
    data = make_jpeg_bytes()
    path = ImageService.save(
        io.BytesIO(data), user_id=user.id, category="places/covers"
    )

    resp = auth_client.get(f"/api/media/{path}")
    assert resp.status_code == 200
    assert resp["Content-Type"] == "image/jpeg"
    # ImageService compresses on save, so bytes differ; verify it's a valid JPEG.
    assert resp.content[:3] == b"\xff\xd8\xff"


@pytest.mark.django_db
@override_settings(
    SECRET_KEY="test-secret-key-long-enough-for-hkdf-derivation-1234",
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    },
)
def test_serve_other_user_file_returns_404(
    auth_client, other_client, tmp_path, settings
):
    settings.MEDIA_ROOT = str(tmp_path)
    other_user = other_client._user
    data = make_jpeg_bytes()
    path = ImageService.save(
        io.BytesIO(data), user_id=other_user.id, category="places/covers"
    )

    resp = auth_client.get(f"/api/media/{path}")
    assert resp.status_code == 404


@pytest.mark.django_db
def test_serve_unauthenticated_returns_401(client, tmp_path, settings):
    settings.MEDIA_ROOT = str(tmp_path)
    resp = client.get("/api/media/users/1/places/covers/abc_def")
    assert resp.status_code == 401


@pytest.mark.django_db
@override_settings(
    SECRET_KEY="test-secret-key-long-enough-for-hkdf-derivation-1234",
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    },
)
def test_serve_nonexistent_file_returns_404(auth_client, tmp_path, settings):
    settings.MEDIA_ROOT = str(tmp_path)
    user = auth_client._user
    resp = auth_client.get(
        f"/api/media/users/{user.id}/places/covers/nonexistent_000"
    )
    assert resp.status_code == 404
