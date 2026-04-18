def _register_and_token(client, username="boarduser", email="board@example.com"):
    res = client.post("/api/v1/auth/register", json={
        "username": username,
        "email": email,
        "password": "password123",
    })
    return res.json()["access_token"]


def test_create_board(client):
    token = _register_and_token(client)
    res = client.post(
        "/api/v1/boards/",
        json={"name": "My Board", "is_public": True, "tags": ["trap"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "My Board"


def test_list_boards(client):
    res = client.get("/api/v1/boards/")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "pages" in data
    assert isinstance(data["items"], list)


def test_get_board(client):
    token = _register_and_token(client, "getboard", "getboard@example.com")
    board = client.post(
        "/api/v1/boards/",
        json={"name": "Detail Board", "is_public": True},
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    res = client.get(f"/api/v1/boards/{board['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == board["id"]


def test_delete_board(client):
    token = _register_and_token(client, "delboard", "delboard@example.com")
    board = client.post(
        "/api/v1/boards/",
        json={"name": "To Delete", "is_public": True},
        headers={"Authorization": f"Bearer {token}"},
    ).json()
    res = client.delete(
        f"/api/v1/boards/{board['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 204
