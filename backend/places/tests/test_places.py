import pytest
from model_bakery import baker

pytestmark = pytest.mark.django_db


def test_create_place(auth_client):
    r = auth_client.post(
        "/api/places/",
        {"name": "Café X", "category": "café", "status": "want_to_visit"},
        format="json",
    )
    assert r.status_code == 201


def test_list_only_own(auth_client, user, other_user):
    baker.make("places.Place", user=user, _quantity=2)
    baker.make("places.Place", user=other_user, _quantity=3)
    r = auth_client.get("/api/places/")
    assert r.status_code == 200
    assert r.data["count"] == 2


def test_cannot_access_others_place(auth_client, other_user):
    p = baker.make("places.Place", user=other_user)
    assert auth_client.get(f"/api/places/{p.id}/").status_code == 404


def test_filter_by_status(auth_client, user):
    baker.make("places.Place", user=user, status="favorite")
    baker.make("places.Place", user=user, status="visited")
    r = auth_client.get("/api/places/?status=favorite")
    assert r.data["count"] == 1


def test_search_by_name(auth_client, user):
    baker.make("places.Place", user=user, name="Padaria Bom Pão")
    baker.make("places.Place", user=user, name="Outro")
    r = auth_client.get("/api/places/?search=Padaria")
    assert r.data["count"] == 1


def test_pagination(auth_client, user):
    baker.make("places.Place", user=user, _quantity=25)
    r = auth_client.get("/api/places/")
    assert r.data["count"] == 25
    assert len(r.data["results"]) == 20


def test_detail_includes_consumables_summary(auth_client, user):
    place = baker.make("places.Place", user=user)
    visit = baker.make("places.Visit", place=place)
    baker.make("places.VisitItem", visit=visit, rating=8, price="12.50")
    baker.make("places.VisitItem", visit=visit, rating=10, price="18.00")

    r = auth_client.get(f"/api/places/{place.id}/")

    assert r.status_code == 200
    assert r.data["consumables_count"] == 2
    assert r.data["average_consumable_rating"] == 9
    assert r.data["total_consumed_amount"] == "30.50"
