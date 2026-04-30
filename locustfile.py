"""
Teste de carga do Bora Ali.

Roda com:
    locust -f locustfile.py --host=http://localhost

Acesse http://localhost:8089 para a UI do Locust.
"""

import random
from locust import HttpUser, between, task


CATEGORIES = ["Café", "Restaurante", "Bar", "Padaria", "Sorveteria"]
STATUSES = ["want_to_visit", "visited", "favorite", "would_not_return"]
ITEM_TYPES = ["sweet", "savory", "drink", "coffee", "juice", "dessert", "other"]


class BoraAliUser(HttpUser):
    """
    Simula um usuário real navegando no app:
    - Faz login uma vez ao iniciar
    - Navega pela lista de places (ação mais frequente)
    - Abre detalhes de um place
    - Cria places e visitas com menor frequência
    """

    wait_time = between(1, 4)  # pausa entre ações, simula comportamento humano

    def on_start(self):
        """Executa uma vez quando o VU sobe — faz login e cria dados iniciais."""
        self._token = None
        self._place_ids = []
        self._visit_ids = []

        # Registra um usuário único por VU
        uid = random.randint(100_000, 999_999)
        self.username = f"load_user_{uid}"
        self.password = "LoadTest@123"

        self.client.post(
            "/api/auth/register/",
            json={
                "username": self.username,
                "email": f"{self.username}@loadtest.com",
                "password": self.password,
            },
        )

        self._login()

        # Cria alguns places iniciais para o VU ter dados para navegar
        for _ in range(3):
            self._criar_place()

    # ------------------------------------------------------------------ #
    # Tarefas — peso indica frequência relativa                           #
    # ------------------------------------------------------------------ #

    @task(5)
    def listar_places(self):
        """Rota mais usada — lista paginada de places do usuário."""
        self._get("/api/places/")

    @task(3)
    def listar_places_com_filtro(self):
        """Simula uso do filtro de status."""
        status = random.choice(STATUSES)
        self._get(f"/api/places/?status={status}")

    @task(2)
    def detalhe_place(self):
        """Abre um place específico."""
        if not self._place_ids:
            return
        place_id = random.choice(self._place_ids)
        self._get(f"/api/places/{place_id}/")

    @task(2)
    def listar_visitas(self):
        """Lista visitas (endpoint de visits)."""
        self._get("/api/visits/")

    @task(1)
    def criar_place(self):
        self._criar_place()

    @task(1)
    def criar_visita(self):
        """Cria uma visita num place existente."""
        if not self._place_ids:
            return
        place_id = random.choice(self._place_ids)
        resp = self._post(
            f"/api/places/{place_id}/visits/",
            json={
                "visited_at": "2024-06-15T14:00:00Z",
                "environment_rating": round(random.uniform(5, 10), 1),
                "service_rating": round(random.uniform(5, 10), 1),
                "overall_rating": round(random.uniform(5, 10), 1),
                "would_return": random.choice([True, False]),
                "general_notes": "Visita registrada via teste de carga.",
            },
        )
        if resp and resp.status_code == 201:
            self._visit_ids.append(resp.json()["id"])

    @task(1)
    def criar_item_visita(self):
        """Adiciona um item numa visita existente."""
        if not self._visit_ids:
            return
        visit_id = random.choice(self._visit_ids)
        self._post(
            f"/api/visits/{visit_id}/items/",
            json={
                "name": f"Item {random.randint(1, 100)}",
                "type": random.choice(ITEM_TYPES),
                "rating": round(random.uniform(5, 10), 1),
                "price": round(random.uniform(5, 50), 2),
                "would_order_again": random.choice([True, False]),
                "notes": "",
            },
        )

    @task(1)
    def refresh_token(self):
        """Simula o frontend renovando o access token."""
        if not self._refresh_token:
            return
        resp = self.client.post(
            "/api/auth/refresh/",
            json={"refresh": self._refresh_token},
        )
        if resp.status_code == 200:
            data = resp.json()
            self._token = data.get("access", self._token)
            self._refresh_token = data.get("refresh", self._refresh_token)

    # ------------------------------------------------------------------ #
    # Helpers internos                                                    #
    # ------------------------------------------------------------------ #

    def _login(self):
        resp = self.client.post(
            "/api/auth/login/",
            json={"username": self.username, "password": self.password},
        )
        if resp.status_code == 200:
            data = resp.json()
            self._token = data["access"]
            self._refresh_token = data["refresh"]

    def _headers(self):
        return {"Authorization": f"Bearer {self._token}"} if self._token else {}

    def _get(self, url):
        return self.client.get(url, headers=self._headers())

    def _post(self, url, json):
        return self.client.post(url, json=json, headers=self._headers())

    def _criar_place(self):
        resp = self._post(
            "/api/places/",
            json={
                "name": f"Place {random.randint(1, 9999)}",
                "category": random.choice(CATEGORIES),
                "address": "Rua de Teste, 123",
                "status": random.choice(STATUSES),
                "notes": "",
            },
        )
        if resp and resp.status_code == 201:
            self._place_ids.append(resp.json()["id"])
