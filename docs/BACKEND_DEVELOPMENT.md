# SoundBoard Backend Development Guide

## Overview

The SoundBoard backend is a modern REST API built with FastAPI, providing a collaborative soundboard platform for managing audio files and sound boards. The backend handles user authentication, board management, sound storage and streaming, and real-time collaboration features.

**Technology Stack:**
- **Framework**: FastAPI 0.111.0+
- **Database**: SQLAlchemy 2.0.30+ with SQLite
- **Authentication**: JWT (Python-Jose)
- **Password Hashing**: Passlib with bcrypt
- **File Handling**: aiofiles for async file operations
- **Rate Limiting**: SlowAPI
- **Validation**: Pydantic 2.10.0+

## Project Structure

```
app/
├── api/
│   ├── v1/
│   │   ├── auth.py           # Authentication endpoints (register, login, refresh)
│   │   ├── users.py          # User profile management
│   │   ├── boards.py         # Board CRUD operations
│   │   ├── sounds.py         # Sound file upload and streaming
│   │   └── router.py         # API router aggregation
│   └── deps.py               # Dependency injection (DB, auth)
├── core/
│   ├── security.py           # Password hashing, JWT token creation
│   └── exceptions.py         # Custom exception handlers
├── models/
│   ├── user.py               # User ORM model
│   ├── board.py              # Board ORM model
│   └── sound.py              # Sound ORM model
├── schemas/
│   ├── user.py               # User validation schemas
│   ├── board.py              # Board validation schemas
│   ├── auth.py               # Auth response schemas
│   └── sound.py              # Sound validation schemas
├── services/
│   ├── auth_service.py       # User registration and login logic
│   ├── user_service.py       # User profile operations
│   ├── board_service.py      # Board filtering and CRUD
│   └── sound_service.py      # Sound file handling
├── db/
│   ├── base.py               # SQLAlchemy declarative base
│   └── init_db.py            # Database initialization
├── main.py                   # FastAPI app instantiation, middleware setup
└── config.py                 # Configuration and settings
```

## Core Components

### 1. Authentication & Security

**Registration Flow:**
- User submits username, email, password
- Backend validates with Pydantic schemas (username 3-30 chars alphanumeric+_, password 8+ chars)
- Password is hashed with bcrypt
- User created in database
- JWT access and refresh tokens returned

**Login Flow:**
- User submits email and password via OAuth2 form
- Password verified against bcrypt hash
- Access token (30 min) and refresh token (7 days) issued
- Tokens stored in localStorage on frontend

**Token Management:**
- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Refresh endpoint allows getting new access token without re-login
- Failed refresh clears tokens and user is redirected to login

### 2. Database Models

**User Model:**
- Stores username, email, hashed password
- Tracks created_at and updated_at timestamps
- One-to-many relationship with boards (user owns multiple boards)

**Board Model:**
- Belongs to a user (owner_id)
- Has name, description, visibility (public/private), tags
- One-to-many relationship with sounds
- Timestamps for creation and updates

**Sound Model:**
- Belongs to a board
- Stores filename, duration, file size, MIME type
- Tags for categorization
- Stream URL for frontend playback

### 3. API Endpoints

**Authentication:**
- `POST /api/v1/auth/register` - Create new user account
- `POST /api/v1/auth/login` - User login with email/password
- `POST /api/v1/auth/refresh` - Get new access token using refresh token

**Users:**
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile
- `GET /api/v1/users/{username}` - Get public user profile
- `GET /api/v1/users/{username}/boards` - Get user's boards

**Boards:**
- `GET /api/v1/boards/` - List public boards (paginated, searchable, filterable by tags)
- `GET /api/v1/boards/my` - List current user's boards
- `GET /api/v1/boards/{id}` - Get board details with sounds
- `POST /api/v1/boards/` - Create new board
- `PUT /api/v1/boards/{id}` - Update board
- `DELETE /api/v1/boards/{id}` - Delete board
- `GET /api/v1/boards/tags` - Get all unique tags from public boards

**Sounds:**
- `POST /api/v1/sounds/upload` - Upload sound file (multipart form)
- `GET /api/v1/sounds/{id}/stream` - Stream audio file
- `PUT /api/v1/sounds/{id}` - Update sound metadata
- `DELETE /api/v1/sounds/{id}` - Delete sound

### 4. Middleware & Features

**CORS:**
- Configured to allow localhost:5173 (dev frontend)
- Configured to allow localhost:3000 and 4173 (alt ports)
- Credentials enabled for cookie-based auth

**Rate Limiting:**
- 100 requests per minute per IP address
- Enforced by SlowAPI middleware
- Prevents abuse

**Error Handling:**
- Custom exceptions for 404 (not found), 403 (forbidden), etc.
- Pydantic validation errors return 422 with detailed field errors
- All errors return JSON responses

## Key Implementation Details

### Data Validation

All request bodies validated with Pydantic schemas:

**UserCreate Schema:**
- Username: 3-30 characters, `^[a-zA-Z0-9_]+$` pattern only
- Email: Valid email format (EmailStr validator)
- Password: Minimum 8 characters

**BoardCreate Schema:**
- Name: Required string
- Description: Optional string
- is_public: Boolean (default true)
- tags: List of strings (optional)

**BoardUpdate Schema:**
- All fields optional (partial updates)

### Access Control

**Public Boards:**
- Visible to anyone without authentication
- Available on `/boards/` endpoint
- Filtered by search terms and tags

**Private Boards:**
- Only accessible to owner
- Requires valid access token
- Returns 403 forbidden if accessed by non-owner

**Board Operations:**
- Only owner can update or delete
- Creating board requires authentication
- Viewing own boards requires authentication

### File Handling

**Upload Process:**
- Files received as multipart/form-data
- Stored in `uploads/` directory
- Maximum file size: 50MB (configurable)
- Filename stored in database, original file path generated from ID

**Streaming:**
- Sound files streamed via `/sounds/{id}/stream` endpoint
- Supports range requests for seeking
- MIME type determined from upload

### Search & Filtering

**Board Search:**
- Case-insensitive search on board name and description
- Using SQLAlchemy `func.lower()` and `.like()` for portability

**Tag Filtering:**
- Tags stored as JSON array in database
- Filter by multiple tags (all must match)
- Uses PostgreSQL/SQLite compatible text casting and LIKE

**Pagination:**
- Default page size: 20, maximum: 100
- Supports offset calculation: `(page - 1) * size`
- Returns total count for UI pagination

## Common Development Tasks

### Adding a New Endpoint

1. Define Pydantic schema in `app/schemas/`
2. Create route in `app/api/v1/{feature}.py`
3. Implement service logic in `app/services/{feature}_service.py`
4. Include in router in `app/api/v1/router.py`
5. Test with FastAPI docs at `/docs`

### Adding a Database Migration

1. Update model in `app/models/`
2. SQLAlchemy will handle schema on next startup (development)
3. For production, use proper migration tool (Alembic)

### Error Handling

- Use custom exceptions from `app/core/exceptions.py`
- Return appropriate HTTP status codes
- Provide meaningful error messages to client

### Authentication

- Use `Depends(get_current_user)` to require auth
- Use `Depends(get_optional_user)` for optional auth
- Check user_id in service layer for authorization

## Known Issues & TODOs

[Space for known issues to be documented]

## Performance Considerations

- Database queries use eager loading of relationships
- Rate limiting prevents abuse
- Async file operations for large uploads
- SQLite suitable for development; consider PostgreSQL for production

## Testing

[Space for testing guidelines and test examples]

## Deployment

[Space for deployment instructions]

---

**Last Updated**: 2026-04-15
**Framework Version**: FastAPI 0.111.0+
**Database**: SQLite (development)
