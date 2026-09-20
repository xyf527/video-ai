from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_returns_ok_without_external_services() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "AI Video Knowledge Assistant",
    }


def test_unversioned_health_route_is_not_exposed() -> None:
    response = client.get("/health")

    assert response.status_code == 404
