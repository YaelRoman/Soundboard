"""Sound upload, metadata, update, delete, and access-control tests."""
import io


# ── helpers ──────────────────────────────────────────────────────────────────

def _register(client, username, email):
    res = client.post("/api/v1/auth/register", json={
        "username": username, "email": email, "password": "password123"
    })
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def _make_board(client, token, name="Test Board"):
    res = client.post("/api/v1/boards/", json={"name": name, "is_public": True},
                      headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201, res.text
    return res.json()["id"]


def _fake_mp3(name="kick.mp3"):
    """Minimal valid MP3-ish bytes (just needs a non-zero payload)."""
    return io.BytesIO(b"\xff\xfb\x90\x00" + b"\x00" * 100), name


def _upload(client, token, board_id, sound_name="Kick", filename="kick.mp3"):
    content, fname = _fake_mp3(filename)
    return client.post(
        "/api/v1/sounds/upload",
        data={"board_id": board_id, "name": sound_name},
        files={"file": (fname, content, "audio/mpeg")},
        headers={"Authorization": f"Bearer {token}"},
    )


# ── upload ────────────────────────────────────────────────────────────────────

def test_upload_sound(client):
    token = _register(client, "uploader", "up@x.com")
    board_id = _make_board(client, token)
    res = _upload(client, token, board_id)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["name"] == "Kick"
    assert data["board_id"] == board_id
    assert data["mime_type"] == "audio/mpeg"
    assert data["stream_url"].endswith("/stream")
    assert data["file_size_bytes"] > 0


def test_upload_wrong_type(client):
    token = _register(client, "wrongtype", "wt@x.com")
    board_id = _make_board(client, token)
    res = client.post(
        "/api/v1/sounds/upload",
        data={"board_id": board_id, "name": "Bad File"},
        files={"file": ("script.js", io.BytesIO(b"alert(1)"), "text/javascript")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


def test_upload_to_nonexistent_board(client):
    token = _register(client, "nobrd", "nobrd@x.com")
    res = _upload(client, token, board_id=99999)
    assert res.status_code == 404


def test_upload_to_other_users_board(client):
    owner = _register(client, "sndowner", "sndowner@x.com")
    other = _register(client, "sndother", "sndother@x.com")
    board_id = _make_board(client, owner)
    res = _upload(client, other, board_id)
    assert res.status_code == 403


def test_upload_requires_auth(client):
    res = client.post(
        "/api/v1/sounds/upload",
        data={"board_id": 1, "name": "Kick"},
        files={"file": ("kick.mp3", io.BytesIO(b"\xff\xfb" + b"\x00" * 50), "audio/mpeg")},
    )
    assert res.status_code == 401


# ── read / stream ─────────────────────────────────────────────────────────────

def test_get_sound_metadata(client):
    token = _register(client, "sndmeta", "sndmeta@x.com")
    board_id = _make_board(client, token)
    sound_id = _upload(client, token, board_id).json()["id"]

    res = client.get(f"/api/v1/sounds/{sound_id}")
    assert res.status_code == 200
    assert res.json()["id"] == sound_id


def test_get_sound_not_found(client):
    res = client.get("/api/v1/sounds/999999")
    assert res.status_code == 404


def test_stream_sound(client):
    token = _register(client, "streamer", "stream@x.com")
    board_id = _make_board(client, token)
    sound_id = _upload(client, token, board_id).json()["id"]

    res = client.get(f"/api/v1/sounds/{sound_id}/stream")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("audio/")


# ── update ────────────────────────────────────────────────────────────────────

def test_update_sound(client):
    token = _register(client, "sndupd", "sndupd@x.com")
    board_id = _make_board(client, token)
    sound_id = _upload(client, token, board_id).json()["id"]

    res = client.put(
        f"/api/v1/sounds/{sound_id}",
        json={"name": "Updated Kick", "tags": ["kick", "drum"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Kick"
    assert "kick" in res.json()["tags"]


def test_update_sound_forbidden(client):
    owner = _register(client, "sndfbowner", "sndfbo@x.com")
    other = _register(client, "sndfbother", "sndfbt@x.com")
    board_id = _make_board(client, owner)
    sound_id = _upload(client, owner, board_id).json()["id"]

    res = client.put(
        f"/api/v1/sounds/{sound_id}",
        json={"name": "Stolen"},
        headers={"Authorization": f"Bearer {other}"},
    )
    assert res.status_code == 403


# ── delete ────────────────────────────────────────────────────────────────────

def test_delete_sound(client):
    token = _register(client, "snddel", "snddel@x.com")
    board_id = _make_board(client, token)
    sound_id = _upload(client, token, board_id).json()["id"]

    res = client.delete(f"/api/v1/sounds/{sound_id}",
                        headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 204

    res = client.get(f"/api/v1/sounds/{sound_id}")
    assert res.status_code == 404


def test_delete_sound_forbidden(client):
    owner = _register(client, "delfbo", "delfbo@x.com")
    other = _register(client, "delfbt", "delfbt@x.com")
    board_id = _make_board(client, owner)
    sound_id = _upload(client, owner, board_id).json()["id"]

    res = client.delete(f"/api/v1/sounds/{sound_id}",
                        headers={"Authorization": f"Bearer {other}"})
    assert res.status_code == 403
