# Bug Fix: Boards Not Saving / Displaying

## Symptoms

- Dashboard ("My Boards") showed an empty list even though boards existed in the database.
- Navigating to a specific board (`/boards/:id`) returned a 500 Internal Server Error.
- Sounds uploaded to a board disappeared after page refresh.
- Deleting a board silently failed.

---

## Root Causes

### 1. Server running stale code (no `--reload`)

The backend was started without `uvicorn --reload`, so code changes made during the session were never picked up. The old version returned board lists as a plain JSON array `[...]` instead of the expected Page object `{ items, total, pages }`.

**Effect:** `data?.items` was always `undefined` → frontend set `boards = []` on every load.

**Fix:** Always start the server with `--reload`:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### 2. `SoundOut.stream_url` missing from ORM objects → 500 on board detail

`GET /boards/{id}` used FastAPI's automatic ORM → Pydantic serialization.  
`BoardOut.sounds` is `list[SoundOut]`, and `SoundOut.stream_url` is a **required field**.  
The `Sound` ORM model has no `stream_url` column — it is computed dynamically.  
Pydantic threw `ValidationError: Field required [stream_url]` → FastAPI returned 500.

**Fix:** Added explicit helper functions in `app/api/v1/boards.py` that build the response objects manually:

```python
def _sound_out(s) -> SoundOut:
    return SoundOut(..., stream_url=f"/api/v1/sounds/{s.id}/stream", ...)

def _to_board_out(b) -> BoardOut:
    return BoardOut(..., sounds=[_sound_out(s) for s in b.sounds], ...)
```

All board routes (`GET /`, `GET /my`, `GET /{id}`, `POST /`, `PUT /{id}`) now use these helpers instead of relying on automatic ORM serialization.

---

### 3. `deleteBoard` passed token as body instead of auth header

```js
// Before — token sent as request body, Authorization header missing → 401
request("DELETE", `/boards/${id}`, getToken())

// After — correct
request("DELETE", `/boards/${id}`, null, getToken())
```

---

### 4. No token auto-refresh → silent logout after 30 minutes

When the access token expired, `getMe()` returned 401, tokens were cleared, and the user was silently redirected to login — losing the appearance of their data.

**Fix:** Added a 401 interceptor in `frontend/src/api/client.js` that automatically calls `POST /auth/refresh` and retries the original request before clearing tokens.

---

### 5. Dashboard swallowed `getMyBoards` errors silently

```js
// Before
.catch(() => {})  // boards appeared empty with no feedback

// After
.catch(err => setLoadErr(err.message ?? "Failed to load boards"))
```

A visible error message with a Retry button now appears if the board list fails to load.

---

### 6. Narrow audio MIME type allowlist blocked some uploads

Some browsers report `audio/mp3` instead of `audio/mpeg`, or `audio/wave` instead of `audio/wav`. Added all common variants to `ALLOWED_MIME_TYPES` in `app/services/sound_service.py`.

---

## Files Changed

| File | Change |
|---|---|
| `app/api/v1/boards.py` | Added `_sound_out`, `_owner_out`, `_to_board_out` helpers; removed `response_model` from all routes |
| `app/services/sound_service.py` | Expanded `ALLOWED_MIME_TYPES` |
| `frontend/src/api/client.js` | Fixed `deleteBoard` null-body bug; added 401 auto-refresh interceptor |
| `frontend/src/pages/Dashboard.jsx` | Added `loadErr` state; errors are now visible with a Retry button |
| `frontend/src/context/AuthContext.jsx` | Simplified catch block (interceptor handles refresh) |
