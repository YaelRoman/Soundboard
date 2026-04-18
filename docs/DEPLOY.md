# Deploy Guide

---

## Railway

1. Push the repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Railway auto-detects the `Dockerfile`.
4. Add environment variables in the Railway dashboard:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Generate a random 32+ char string |
| `DATABASE_URL` | Railway PostgreSQL plugin URL, or leave blank for SQLite |
| `APP_ENV` | `production` |
| `UPLOAD_DIR` | `/app/uploads` |

5. Add a **Volume** mounted at `/app/uploads` so uploads survive redeploys.
6. The `railway.toml` at the project root handles the rest.

---

## Render

1. Push to GitHub.
2. In Render: **New → Web Service → Connect repo**.
3. Render detects `render.yaml` automatically on first deploy.
4. Override `SECRET_KEY` in the Render dashboard (Environment tab).
5. The `render.yaml` provisions a 5 GB persistent disk at `/app/uploads`.

---

## Docker (self-hosted)

```bash
# Build
docker build -t soundboard-api .

# Run (development)
docker run -p 8000:8000 \
  -e SECRET_KEY=your-secret \
  -v $(pwd)/uploads:/app/uploads \
  soundboard-api

# Production with PostgreSQL
docker run -p 8000:8000 \
  -e SECRET_KEY=your-secret \
  -e DATABASE_URL=postgresql://user:pass@db:5432/soundboard \
  -e APP_ENV=production \
  -v /data/soundboard/uploads:/app/uploads \
  soundboard-api
```

---

## Switching to PostgreSQL

1. Set `DATABASE_URL=postgresql://user:pass@host:5432/soundboard` in your env.
2. Run once to create tables:
   ```bash
   python -c "from app.db.init_db import init_db; init_db()"
   ```
3. Add `psycopg2-binary` to `requirements.txt`.

---

## Environment variables reference

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key` | **Change in prod.** JWT signing key |
| `DATABASE_URL` | `sqlite:///./soundboard.db` | SQLAlchemy connection string |
| `APP_ENV` | `development` | `development` or `production` |
| `UPLOAD_DIR` | `uploads` | Path where audio files are stored |
| `MAX_FILE_SIZE_MB` | `50` | Max upload size |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | JWT refresh token TTL |
