# Frontend Contract — SoundBoard API

> Guía oficial para el equipo de FrontEnd.  
> Base URL: `http://localhost:8000/api/v1`

---

## Setup del cliente

```javascript
// config/api.js
const API_BASE = "http://localhost:8000/api/v1";

const api = {
  async request(method, endpoint, body = null, token = null) {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw Object.assign(new Error(err.detail), { status: res.status });
    }
    if (res.status === 204) return null;
    return res.json();
  },
  get:    (ep, token)       => api.request("GET",    ep, null, token),
  post:   (ep, body, token) => api.request("POST",   ep, body, token),
  put:    (ep, body, token) => api.request("PUT",    ep, body, token),
  delete: (ep, token)       => api.request("DELETE", ep, null, token),
};
```

---

## Auth

```javascript
// Register
const { access_token, refresh_token, user } = await api.post("/auth/register", {
  username: "dj_orden",
  email: "orden@ibero.mx",
  password: "SuperSecure123",
});
localStorage.setItem("access_token", access_token);
localStorage.setItem("refresh_token", refresh_token);

// Login  (form-encoded, not JSON)
const loginRes = await fetch(`${API_BASE}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ username: "orden@ibero.mx", password: "SuperSecure123" }),
});
const { access_token } = await loginRes.json();

// Refresh
const token = localStorage.getItem("refresh_token");
const refreshed = await api.post(`/auth/refresh?refresh_token=${token}`);
localStorage.setItem("access_token", refreshed.access_token);

// Logout (client-side only)
localStorage.removeItem("access_token");
localStorage.removeItem("refresh_token");
```

---

## Boards

### List public boards (paginated)

```javascript
// GET /boards/?page=1&size=20
const page = await api.get("/boards/?page=1&size=20");
// page = { items: [...], total: 42, page: 1, size: 20, pages: 3 }

// Search
const results = await api.get("/boards/?q=trap&page=1");

// Filter by tags (repeat param for multiple)
const tagged = await api.get("/boards/?tags=808&tags=bass");

// Combined
const combo = await api.get("/boards/?q=trap&tags=808&page=1&size=10");
```

### All tags (for tag-picker UI)

```javascript
const tags = await api.get("/boards/tags");
// ["808", "bass", "chill", "drums", "funk", ...]
```

### My boards (auth required)

```javascript
const token = localStorage.getItem("access_token");
const myBoards = await api.get("/boards/my?page=1", token);
```

### Create board

```javascript
const board = await api.post("/boards/", {
  name: "Trap Essentials Vol.1",
  description: "Lo mejor del trap",
  is_public: true,
  tags: ["trap", "808", "drums"],
}, token);
```

### Get board detail (includes sounds array)

```javascript
const board = await api.get(`/boards/${boardId}`);
// For private boards, pass token:
const privateBoard = await api.get(`/boards/${boardId}`, token);
```

### Update / Delete

```javascript
await api.put(`/boards/${boardId}`, { name: "New Name", tags: ["new"] }, token);
await api.delete(`/boards/${boardId}`, token);
```

---

## Sounds

### Upload audio

```javascript
async function uploadSound(file, boardId, name, tags = []) {
  const token = localStorage.getItem("access_token");
  const form = new FormData();
  form.append("file", file);                 // File object from <input type="file">
  form.append("board_id", boardId);
  form.append("name", name);
  tags.forEach(t => form.append("tags", t));

  const sound = await api.post("/sounds/upload", form, token);
  return sound;
  // { id, name, filename, file_size_bytes, mime_type, stream_url, board_id, tags, created_at }
}
```

Accepted types: `audio/mpeg` (mp3), `audio/wav`, `audio/ogg`, `audio/flac`.  
Max size: **50 MB**.

### Play a sound

```javascript
function playSound(soundId) {
  const audio = new Audio(`${API_BASE}/sounds/${soundId}/stream`);
  audio.play();
}

// With Web Audio API (for waveform visualiser)
async function loadAudioBuffer(soundId, audioCtx) {
  const res = await fetch(`${API_BASE}/sounds/${soundId}/stream`);
  const arrayBuffer = await res.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}
```

### Update metadata / Delete

```javascript
await api.put(`/sounds/${soundId}`, { name: "808 Sub", tags: ["808"] }, token);
await api.delete(`/sounds/${soundId}`, token);
```

---

## Users

```javascript
// Authenticated profile
const me = await api.get("/users/me", token);

// Update profile
await api.put("/users/me", { username: "new_name", avatar_url: "https://..." }, token);

// Public profile (no token needed)
const profile = await api.get("/users/dj_orden");
// { id, username, avatar_url, boards_count, sounds_count }

// User's public boards
const boards = await api.get("/users/dj_orden/boards");
```

---

## Error handling

```javascript
try {
  const board = await api.post("/boards/", { name: "" }, token);
} catch (err) {
  if (err.status === 422) {
    // Validation error — show field feedback
    console.error("Validation:", err.message);
  } else if (err.status === 401) {
    // Token expired — redirect to login or refresh
    redirectToLogin();
  } else if (err.status === 429) {
    // Rate limited — back off and retry
    showToast("Too many requests, please wait.");
  }
}
```

---

## CORS origins configured

- `http://localhost:5173` (Vite)
- `http://localhost:3000` (CRA / Next.js)
- `http://localhost:4173` (Vite preview)

For any other port, ask the backend team to add it.

---

## Interactive docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
