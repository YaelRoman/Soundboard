def test_register(client):
    res = client.post("/api/v1/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "testuser"


def test_register_duplicate_email(client):
    payload = {"username": "user2", "email": "dupe@example.com", "password": "password123"}
    client.post("/api/v1/auth/register", json=payload)
    res = client.post("/api/v1/auth/register", json={**payload, "username": "user3"})
    assert res.status_code == 409


def test_login(client):
    client.post("/api/v1/auth/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "password123",
    })
    res = client.post("/api/v1/auth/login", data={
        "username": "login@example.com",
        "password": "password123",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client):
    res = client.post("/api/v1/auth/login", data={
        "username": "nobody@example.com",
        "password": "wrong",
    })
    assert res.status_code == 401
