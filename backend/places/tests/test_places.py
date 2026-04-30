import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from model_bakery import baker

pytestmark = pytest.mark.django_db


def test_create_place(auth_client):
    r = auth_client.post(
        "/api/places/",
        {"name": "Café X", "category": "café", "status": "want_to_visit"},
        format="json",
    )
    assert r.status_code == 201


def test_create_place_returns_public_id(auth_client):
    r = auth_client.post(
        "/api/places/",
        {"name": "Café X", "category": "café", "status": "want_to_visit"},
        format="json",
    )
    assert r.status_code == 201
    assert "public_id" in r.data
    assert "id" not in r.data


def test_create_place_accepts_manual_coordinates(auth_client):
    r = auth_client.post(
        "/api/places/",
        {
            "name": "Café X",
            "category": "café",
            "status": "want_to_visit",
            "latitude": "-3.1019444",
            "longitude": "-60.0250000",
        },
        format="json",
    )

    assert r.status_code == 201
    assert r.data["latitude"] == "-3.1019444"
    assert r.data["longitude"] == "-60.0250000"


def test_manual_coordinates_override_maps_url(auth_client):
    r = auth_client.post(
        "/api/places/",
        {
            "name": "Café X",
            "category": "café",
            "status": "want_to_visit",
            "maps_url": (
                "https://maps.google.com/maps?q=-3.0000000,-60.0000000"
            ),
            "latitude": "-3.1019444",
            "longitude": "-60.0250000",
        },
        format="json",
    )

    assert r.status_code == 201
    assert r.data["latitude"] == "-3.1019444"
    assert r.data["longitude"] == "-60.0250000"


def test_list_only_own(auth_client, user, other_user):
    baker.make("places.Place", user=user, _quantity=2)
    baker.make("places.Place", user=other_user, _quantity=3)
    r = auth_client.get("/api/places/")
    assert r.status_code == 200
    assert r.data["count"] == 2


def test_cannot_access_others_place(auth_client, other_user):
    p = baker.make("places.Place", user=other_user)
    assert auth_client.get(f"/api/places/{p.public_id}/").status_code == 404


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

    r = auth_client.get(f"/api/places/{place.public_id}/")

    assert r.status_code == 200
    assert r.data["consumables_count"] == 2
    assert float(r.data["average_consumable_rating"]) == 9.0
    assert r.data["total_consumed_amount"] == "30.50"


def test_detail_avoids_n_plus_one_queries(auth_client, user):
    place = baker.make("places.Place", user=user)
    visits = baker.make("places.Visit", place=place, _quantity=3)
    for visit in visits:
        baker.make("places.VisitItem", visit=visit, _quantity=4)

    with CaptureQueriesContext(connection) as queries:
        r = auth_client.get(f"/api/places/{place.public_id}/")

    assert r.status_code == 200
    assert len(queries) == 3


def test_list_can_expand_visits(auth_client, user):
    place = baker.make("places.Place", user=user)
    baker.make("places.Visit", place=place)

    r = auth_client.get("/api/places/?expand=visits")

    assert r.status_code == 200
    assert "visits" in r.data["results"][0]
    assert len(r.data["results"][0]["visits"]) == 1


def test_list_expand_visits_items_avoids_n_plus_one(auth_client, user):
    places = baker.make("places.Place", user=user, _quantity=5)
    for place in places:
        visits = baker.make("places.Visit", place=place, _quantity=2)
        for visit in visits:
            baker.make("places.VisitItem", visit=visit, _quantity=2)

    with CaptureQueriesContext(connection) as queries:
        r = auth_client.get("/api/places/?expand=visits.items")

    assert r.status_code == 200
    assert len(r.data["results"]) == 5
    assert "items" in r.data["results"][0]["visits"][0]
    assert len(queries) <= 7
