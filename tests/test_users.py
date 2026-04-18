"""User profile, update, and access-control tests."""


def _register(client, username, email):
    res = client.post("/api/v1/auth/register", json={
        "username": username, "email": email, "password": "password123"
    })
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


# ── /users/me ─────────────────────────────────────────────────────────────────

def test_get_me(client):
    token = _register(client, "meuser", "me@x.com")
    res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "meuser"
    assert "email" in res.json()
    assert "hashed_password" not in res.json()


def test_get_me_unauthenticated(client):
    res = client.get("/api/v1/users/me")
    assert res.status_code == 401


def test_update_me(client):
    token = _register(client, "updateme", "updateme@x.com")
    res = client.put("/api/v1/users/me",
                     json={"username": "updateme2"},
                     headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "updateme2"


def test_update_me_username_conflict(client):
    token_a = _register(client, "conflict_a", "confa@x.com")
    _register(client, "conflict_b", "confb@x.com")
    res = client.put("/api/v1/users/me",
                     json={"username": "conflict_b"},
                     headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 409


# ── public profile ────────────────────────────────────────────────────────────

def test_get_public_profile(client):
    token = _register(client, "pubprofile", "pub@x.com")
    res = client.get("/api/v1/users/pubprofile")
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "pubprofile"
    assert "boards_count" in data
    assert "sounds_count" in data
    assert "email" not in data
    assert "hashed_password" not in data


def test_get_nonexistent_user(client):
    res = client.get("/api/v1/users/nobody_here_xyz")
    assert res.status_code == 404


def test_get_user_boards(client):
    token = _register(client, "boardsowner", "bo@x.com")
    client.post("/api/v1/boards/", json={"name": "Public Board", "is_public": True},
                headers={"Authorization": f"Bearer {token}"})
    client.post("/api/v1/boards/", json={"name": "Private Board", "is_public": False},
                headers={"Authorization": f"Bearer {token}"})

    res = client.get("/api/v1/users/boardsowner/boards")
    assert res.status_code == 200
    boards = res.json()
    # private boards must not appear in public list
    assert all(b["is_public"] for b in boards)
    assert any(b["name"] == "Public Board" for b in boards)


# ── access control ────────────────────────────────────────────────────────────

def test_invalid_token_rejected(client):
    res = client.get("/api/v1/users/me",
                     headers={"Authorization": "Bearer not.a.real.token"})
    assert res.status_code == 401


def test_private_board_not_accessible_by_other(client):
    owner = _register(client, "privowner", "privo@x.com")
    other = _register(client, "privother", "privt@x.com")
    board = client.post("/api/v1/boards/", json={"name": "Secret", "is_public": False},
                        headers={"Authorization": f"Bearer {owner}"}).json()

    res = client.get(f"/api/v1/boards/{board['id']}",
                     headers={"Authorization": f"Bearer {other}"})
    assert res.status_code == 403


def test_private_board_accessible_by_owner(client):
    token = _register(client, "privself", "privs@x.com")
    board = client.post("/api/v1/boards/", json={"name": "My Secret", "is_public": False},
                        headers={"Authorization": f"Bearer {token}"}).json()

    res = client.get(f"/api/v1/boards/{board['id']}",
                     headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
