import pytest

pytestmark = pytest.mark.django_db


def test_register(api_client):
    r = api_client.post(
        "/api/auth/register/",
        {"username": "carol", "email": "c@c.com", "password": "Strong-Pass1!", "confirm_password": "Strong-Pass1!"},
        format="json",
    )
    assert r.status_code == 201


def test_login_returns_tokens(api_client, user):
    r = api_client.post("/api/auth/login/", {"username": "alice", "password": "pw12345!"}, format="json")
    assert r.status_code == 200
    assert "access" in r.data
    assert "refresh" in r.data


def test_login_with_email_returns_tokens(api_client, user):
    r = api_client.post("/api/auth/login/", {"username": "a@a.com", "password": "pw12345!"}, format="json")
    assert r.status_code == 200
    assert "access" in r.data
    assert "refresh" in r.data


def test_refresh(api_client, user):
    tokens = api_client.post("/api/auth/login/", {"username": "alice", "password": "pw12345!"}, format="json").data
    r = api_client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
    assert r.status_code == 200
    assert "access" in r.data


def test_logout_blacklists(api_client, user):
    tokens = api_client.post("/api/auth/login/", {"username": "alice", "password": "pw12345!"}, format="json").data
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    r = api_client.post("/api/auth/logout/", {"refresh": tokens["refresh"]}, format="json")
    assert r.status_code == 205
    r2 = api_client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
    assert r2.status_code == 401


def test_change_password(auth_client, api_client):
    r = auth_client.post(
        "/api/auth/password/",
        {
            "current_password": "pw12345!",
            "new_password": "New-Strong-Pass1!",
            "confirm_password": "New-Strong-Pass1!",
        },
        format="json",
    )
    assert r.status_code == 204

    login = api_client.post(
        "/api/auth/login/",
        {"username": "alice", "password": "New-Strong-Pass1!"},
        format="json",
    )
    assert login.status_code == 200


def test_unauth_blocked(api_client):
    assert api_client.get("/api/auth/me/").status_code == 401
