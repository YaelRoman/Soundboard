"""Phase 2 feature tests: pagination, search, tags, validators, public profile."""


# ── helpers ──────────────────────────────────────────────────────────────────

def _register(client, username, email="x@x.com"):
    res = client.post("/api/v1/auth/register", json={
        "username": username, "email": email, "password": "password123"
    })
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def _make_board(client, token, name, tags=None, is_public=True):
    payload = {"name": name, "is_public": is_public, "tags": tags or []}
    res = client.post("/api/v1/boards/", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201, res.text
    return res.json()


# ── pagination ────────────────────────────────────────────────────────────────

def test_pagination_shape(client):
    token = _register(client, "paguser", "pag@x.com")
    for i in range(3):
        _make_board(client, token, f"Pag Board {i}", tags=["pag"])
    res = client.get("/api/v1/boards/?page=1&size=2")
    assert res.status_code == 200
    d = res.json()
    assert d["size"] == 2
    assert d["page"] == 1
    assert len(d["items"]) <= 2
    assert d["total"] >= 3
    assert d["pages"] >= 2


# ── search ────────────────────────────────────────────────────────────────────

def test_search_by_name(client):
    token = _register(client, "srchuser", "srch@x.com")
    _make_board(client, token, "UniqueAlpha Board", tags=["search"])
    _make_board(client, token, "Something Else", tags=["other"])

    res = client.get("/api/v1/boards/?q=UniqueAlpha")
    assert res.status_code == 200
    items = res.json()["items"]
    assert any("UniqueAlpha" in b["name"] for b in items)


def test_search_no_match(client):
    res = client.get("/api/v1/boards/?q=xyzzy_no_match_at_all")
    assert res.status_code == 200
    assert res.json()["total"] == 0


# ── tag filter ────────────────────────────────────────────────────────────────

def test_filter_by_tag(client):
    token = _register(client, "tagfilter", "tagf@x.com")
    _make_board(client, token, "Tagged Board", tags=["jazz"])
    _make_board(client, token, "Untagged Board", tags=["rock"])

    res = client.get("/api/v1/boards/?tags=jazz")
    assert res.status_code == 200
    items = res.json()["items"]
    assert all("jazz" in b["tags"] for b in items)


def test_tags_endpoint(client):
    token = _register(client, "taglistuser", "tagl@x.com")
    _make_board(client, token, "Soul Board", tags=["soul", "funk"])
    res = client.get("/api/v1/boards/tags")
    assert res.status_code == 200
    tags = res.json()
    assert isinstance(tags, list)
    assert "soul" in tags
    assert "funk" in tags
    assert tags == sorted(tags)  # must be sorted


# ── security validators ───────────────────────────────────────────────────────

def test_password_too_short(client):
    res = client.post("/api/v1/auth/register", json={
        "username": "shortpw", "email": "short@x.com", "password": "abc"
    })
    assert res.status_code == 422


def test_username_too_short(client):
    res = client.post("/api/v1/auth/register", json={
        "username": "ab", "email": "ab@x.com", "password": "password123"
    })
    assert res.status_code == 422


def test_username_invalid_chars(client):
    res = client.post("/api/v1/auth/register", json={
        "username": "bad user!", "email": "bad@x.com", "password": "password123"
    })
    assert res.status_code == 422


def test_board_name_empty(client):
    token = _register(client, "emptyname", "empty@x.com")
    res = client.post("/api/v1/boards/", json={"name": "   ", "is_public": True},
                      headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 422


def test_board_tags_normalised(client):
    token = _register(client, "tagnorm", "norm@x.com")
    board = _make_board(client, token, "Norm Board", tags=["  TRAP  ", "808"])
    assert "trap" in board["tags"]
    assert "808" in board["tags"]


# ── public user profile ───────────────────────────────────────────────────────

def test_public_profile_counts(client):
    token = _register(client, "profileuser", "prof@x.com")
    _make_board(client, token, "Profile Board 1", tags=["profile"])
    _make_board(client, token, "Profile Board 2", tags=["profile"])

    res = client.get("/api/v1/users/profileuser")
    assert res.status_code == 200
    profile = res.json()
    assert profile["username"] == "profileuser"
    assert profile["boards_count"] >= 2
    assert "sounds_count" in profile
