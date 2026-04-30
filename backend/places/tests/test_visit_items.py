import pytest
from model_bakery import baker

pytestmark = pytest.mark.django_db

PAYLOAD = {
    "name": "Espresso",
    "type": "coffee",
    "rating": 9,
    "price": "12.50",
    "would_order_again": True,
}


def test_create_in_own_visit(auth_client, user):
    v = baker.make("places.Visit", place__user=user)
    r = auth_client.post(f"/api/visits/{v.public_id}/items/", PAYLOAD, format="json")
    assert r.status_code == 201
    assert "public_id" in r.data
    assert "id" not in r.data


def test_reject_foreign_visit(auth_client, other_user):
    v = baker.make("places.Visit", place__user=other_user)
    assert auth_client.post(f"/api/visits/{v.public_id}/items/", PAYLOAD, format="json").status_code == 404


def test_negative_price_rejected(auth_client, user):
    v = baker.make("places.Visit", place__user=user)
    bad = {**PAYLOAD, "price": "-1.00"}
    assert auth_client.post(f"/api/visits/{v.public_id}/items/", bad, format="json").status_code == 400


def test_rating_out_of_range(auth_client, user):
    v = baker.make("places.Visit", place__user=user)
    bad = {**PAYLOAD, "rating": 11}
    assert auth_client.post(f"/api/visits/{v.public_id}/items/", bad, format="json").status_code == 400
