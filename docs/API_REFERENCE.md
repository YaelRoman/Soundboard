# SoundBoard API — Reference

**Base URL:** `http://localhost:8000/api/v1`  
**Version:** 2.0.0  
**Format:** JSON (except file upload and audio streaming)  
**Auth:** `Authorization: Bearer <access_token>`

---

## Response codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Bad request (invalid file type, oversized file) |
| 401 | Missing or invalid token |
| 403 | Authenticated but not the owner |
| 404 | Resource not found |
| 409 | Conflict (duplicate email/username) |
| 422 | Validation error (field constraints) |
| 429 | Rate limit exceeded (100 req/min per IP) |
| 500 | Server error |

## Error body

```json
{ "detail": "Human-readable message" }
```

---

## Pagination

All list endpoints return a `Page` object:

```json
{
  "items":  [ ... ],
  "total":  42,
  "page":   1,
  "size":   20,
  "pages":  3
}
```

Query params: `?page=1&size=20` (size max: 100)

---

## Auth

### POST `/auth/register`

```json
// request
{ "username": "dj_orden", "email": "orden@ibero.mx", "password": "min8chars" }

// 201 response
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "username": "dj_orden", "email": "orden@ibero.mx", "avatar_url": null, "created_at": "..." }
}
```

Constraints: username 3–30 chars, alphanumeric + `_`; password ≥8 chars.

### POST `/auth/login`

`Content-Type: application/x-www-form-urlencoded`

```
username=orden@ibero.mx&password=min8chars
```

Returns same body as register. Note: the `username` field accepts the **email**.

### POST `/auth/refresh`

```
POST /auth/refresh?refresh_token=<jwt>
```

Returns new token pair.

---

## Users

### GET `/users/me` *(auth)*
Returns the authenticated user's full profile (includes email).

### PUT `/users/me` *(auth)*
```json
// request (all fields optional)
{ "username": "new_name", "avatar_url": "https://..." }
```

### GET `/users/{username}`
Public profile — no email exposed.
```json
{
  "id": 1, "username": "dj_orden", "avatar_url": null,
  "boards_count": 5, "sounds_count": 23
}
```

### GET `/users/{username}/boards`
Returns list of that user's **public** boards as `BoardSummary[]`.

---

## Boards

### GET `/boards/` — list public boards

Query params:

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Default 1 |
| `size` | int | Default 20, max 100 |
| `q` | string | Search name + description |
| `tags` | string[] | Filter: all tags must match. Repeat: `?tags=trap&tags=808` |

Returns `Page[BoardSummary]`.

### GET `/boards/tags`
Returns `string[]` of all unique tags across public boards, sorted A–Z.

### GET `/boards/my` *(auth)*
Same query params as above. Returns the authenticated user's boards (public + private).

### POST `/boards/` *(auth)*
```json
// request
{ "name": "Trap Vol.1", "description": "...", "is_public": true, "tags": ["trap", "808"] }
```
Tags are auto-lowercased and trimmed. Max 10 tags. Returns `BoardOut`.

### GET `/boards/{id}`
Returns `BoardOut` with the full `sounds[]` array.  
Private boards require the owner's token.

### PUT `/boards/{id}` *(owner)*
Same fields as create, all optional.

### DELETE `/boards/{id}` *(owner)*
204 No Content. Cascades to all sounds (files deleted from disk).

---

## Sounds

### POST `/sounds/upload` *(auth)*

`Content-Type: multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `file` | File | yes — mp3, wav, ogg, flac (max 50 MB) |
| `board_id` | int | yes |
| `name` | string | yes |
| `tags` | string[] | no |

```json
// 201 response
{
  "id": 7, "name": "808 Bass", "filename": "uuid.mp3",
  "duration_ms": null, "file_size_bytes": 48320,
  "mime_type": "audio/mpeg",
  "stream_url": "/api/v1/sounds/7/stream",
  "board_id": 42, "tags": ["808", "bass"],
  "created_at": "..."
}
```

### GET `/sounds/{id}`
Returns metadata (same shape as above, no binary).

### GET `/sounds/{id}/stream`
Returns the raw audio file. Supports `Accept-Ranges: bytes` for browser scrubbing.

### PUT `/sounds/{id}` *(owner)*
```json
{ "name": "New Name", "tags": ["new", "tags"] }
```

### DELETE `/sounds/{id}` *(owner)*
204. Removes the file from disk.

---

## Validation rules summary

| Field | Rule |
|-------|------|
| `username` | 3–30 chars, `[a-zA-Z0-9_]` only |
| `password` | ≥ 8 characters |
| `board.name` | 1–100 chars (whitespace-trimmed) |
| `board.tags` | Max 10; auto-lowercased and trimmed |
| Audio file | mp3 / wav / ogg / flac; max 50 MB |
| Rate limit | 100 requests / minute / IP |
