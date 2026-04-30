import pytest
from model_bakery import baker

pytestmark = pytest.mark.django_db

PAYLOAD = {
    "visited_at": "2026-04-29T12:00:00Z",
    "environment_rating": 8,
    "service_rating": 9,
    "overall_rating": 9,
    "would_return": True,
    "general_notes": "ok",
}


def test_create_visit_in_own_place(auth_client, user):
    p = baker.make("places.Place", user=user)
    r = auth_client.post(f"/api/places/{p.id}/visits/", PAYLOAD, format="json")
    assert r.status_code == 201


def test_reject_foreign_place(auth_client, other_user):
    p = baker.make("places.Place", user=other_user)
    r = auth_client.post(f"/api/places/{p.id}/visits/", PAYLOAD, format="json")
    assert r.status_code == 404


def test_rating_out_of_range(auth_client, user):
    p = baker.make("places.Place", user=user)
    bad = {**PAYLOAD, "overall_rating": 11}
    assert auth_client.post(f"/api/places/{p.id}/visits/", bad, format="json").status_code == 400


def test_negative_rating(auth_client, user):
    p = baker.make("places.Place", user=user)
    bad = {**PAYLOAD, "environment_rating": -1}
    assert auth_client.post(f"/api/places/{p.id}/visits/", bad, format="json").status_code == 400
