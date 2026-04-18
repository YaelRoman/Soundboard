# FastAPI Framework Implementation Manual

## Introduction

FastAPI is a modern Python web framework for building APIs with type hints and automatic documentation. It combines the speed of Starlette with data validation of Pydantic, making it ideal for building production-ready APIs quickly.

**Key Benefits:**
- Automatic API documentation (Swagger UI, ReDoc)
- Type hints for validation and IDE support
- Automatic request/response validation
- Built-in dependency injection
- Async/await native support
- Fast performance (comparable to Node.js)

## Core Concepts

### 1. Application Setup

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="API Title",
    description="API description",
    version="1.0.0",
    docs_url="/docs",           # Swagger UI
    redoc_url="/redoc",         # ReDoc
)
```

**In SoundBoard:**
- App created with title, description, version
- Lifespan context manager initializes database
- CORS middleware enables frontend communication
- SlowAPI middleware enforces rate limiting

### 2. Routers & Organization

Routers group related endpoints and can be versioned:

**File Structure Pattern:**
```
api/
├── v1/
│   ├── auth.py        # APIRouter with auth endpoints
│   ├── users.py       # APIRouter with user endpoints
│   ├── boards.py      # APIRouter with board endpoints
│   ├── sounds.py      # APIRouter with sound endpoints
│   └── router.py      # Main router combining all
└── deps.py            # Shared dependencies
```

**Router Registration:**
```python
app.include_router(api_router, prefix="/api/v1")
```

This allows:
- Versioning APIs (`/api/v1/`, `/api/v2/`)
- Organizing by feature
- Reusing middleware and error handlers per router

### 3. Dependency Injection

FastAPI's dependency system is powerful and reusable:

**Common Dependencies:**
- Database session: `get_db()`
- Current authenticated user: `get_current_user()`
- Optional user: `get_optional_user()`

**Usage:**
```python
@router.get("/users/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return current_user
```

**How It Works:**
1. FastAPI inspects function signature
2. Resolves each `Depends()` by calling the dependency function
3. Passes result to route handler
4. Dependencies can depend on other dependencies (chaining)

**In SoundBoard:**
- `get_db()`: Returns SQLAlchemy session from connection pool
- `get_current_user()`: Validates JWT, returns User model or raises 401
- `get_optional_user()`: Returns User or None (no 401)

### 4. Pydantic Models for Validation

Pydantic models define request/response schemas with automatic validation:

**Input Validation (Request Body):**
```python
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3 or len(v) > 30:
            raise ValueError("Username must be 3-30 characters")
        return v
```

**Response Schemas:**
```python
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    
    model_config = {"from_attributes": True}  # ORM mode
```

**Key Features:**
- Type hints define expected types
- `EmailStr` validates email format
- `@field_validator` for custom logic
- `from_attributes=True` allows converting ORM models
- FastAPI returns 422 with detailed errors if validation fails

### 5. HTTP Methods & Status Codes

**Standard REST Methods:**
```python
@router.get("/items/{item_id}")          # Retrieve resource
@router.post("/items", status_code=201)  # Create resource (201 Created)
@router.put("/items/{item_id}")          # Replace resource
@router.delete("/items/{item_id}", status_code=204)  # Delete (204 No Content)
```

**Status Codes in SoundBoard:**
- `200 OK`: Default for successful GET/PUT
- `201 Created`: POST that creates resource
- `204 No Content`: DELETE successful (no response body)
- `400 Bad Request`: Invalid input (form validation)
- `401 Unauthorized`: Missing/invalid authentication
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `422 Unprocessable Entity`: Validation error

### 6. Path Parameters & Query Parameters

```python
# Path parameter (required)
@router.get("/users/{user_id}")
def get_user(user_id: int):
    # Type hint automatically validates integer
    return user_id

# Query parameters (optional)
@router.get("/boards")
def list_boards(
    page: int = Query(1, ge=1),           # Default 1, >= 1
    size: int = Query(20, ge=1, le=100),  # Default 20, <= 100
    q: str | None = Query(None),          # Optional search
):
    return {"page": page, "size": size}
```

**In SoundBoard:**
- Board list uses query params for pagination: `?page=1&size=20`
- Board list uses query params for search: `?q=keyword`
- Board list uses repeated query params for tags: `?tags=trap&tags=drums`

### 7. Request Bodies

```python
# JSON body
@router.post("/boards")
def create_board(data: BoardCreate):  # Auto-parsed from JSON
    return data

# Multiple inputs
@router.put("/boards/{board_id}")
def update_board(
    board_id: int,           # Path param
    data: BoardUpdate,       # JSON body
    db: Session = Depends(get_current_user)  # Dependency
):
    return data

# Form data (for file uploads)
@router.post("/sounds/upload")
def upload_sound(
    file: UploadFile = File(),
    board_id: int = Form(),
    db: Session = Depends(get_db)
):
    return file.filename
```

### 8. Response Models

Control what data is returned to client:

```python
@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    return user  # FastAPI serializes using UserOut schema
```

**Benefits:**
- Documents response schema
- Automatically filters private fields
- Type checking on response data
- Consistent API contracts

### 9. Middleware

Middleware processes requests/responses globally:

**CORS Middleware (in SoundBoard):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,                    # Allow cookies
    allow_methods=["*"],                       # All HTTP methods
    allow_headers=["*"],                       # All headers
)
```

**Rate Limiting Middleware (SlowAPI):**
```python
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
```

Order matters: middleware is applied in reverse order of addition.

### 10. Exception Handling

```python
# Custom exception
class NotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=404, detail="Resource not found")

# In route
@router.get("/items/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).get(item_id)
    if not item:
        raise NotFoundError()  # Returns 404 JSON response
    return item
```

**In SoundBoard:**
- `not_found()`: Returns 404
- `forbidden()`: Returns 403
- `unauthorized()`: Returns 401

### 11. Security & JWT

**OAuth2 Password Flow (for login):**
```python
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    # Decode JWT token
    # Return user if valid, raise 401 if invalid
    pass
```

**JWT Tokens:**
- Issued on successful login and registration
- Access token (short-lived): User's permission token
- Refresh token (long-lived): Used to get new access token
- Encoded with secret key and expiration time

**In SoundBoard:**
- JWT stores user ID (`sub` claim)
- Access token expires in 30 minutes
- Refresh token expires in 7 days
- Frontend includes token in `Authorization: Bearer {token}` header

### 12. Lifespan Context Manager

Runs code on app startup and shutdown:

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code here
    init_db()
    yield
    # Shutdown code here (cleanup)
    pass

app = FastAPI(lifespan=lifespan)
```

**In SoundBoard:**
- Initializes database on startup
- Creates tables if they don't exist

### 13. Async/Await

FastAPI is async-first for high concurrency:

```python
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    # Async function (can use await)
    return user

# File operations
async with aiofiles.open(path, "rb") as f:
    content = await f.read()
```

**In SoundBoard:**
- Routes can be async or sync
- File upload/download use async file operations
- Database operations are sync (SQLAlchemy blocking)

## Configuration & Settings

FastAPI uses Pydantic Settings for configuration:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./soundboard.db"
    secret_key: str = "dev-key"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"  # Load from .env file

settings = Settings()
```

**In SoundBoard:**
- Database URL from settings
- JWT secret key
- Token expiration times
- Upload directory path
- Max file size

Load from `.env` file in development, environment variables in production.

## Documentation & API Explorer

FastAPI automatically generates documentation:

**Swagger UI:** `http://localhost:8000/docs`
- Interactive API exploration
- Try endpoints with different inputs
- See request/response examples
- Automatically generated from route definitions

**ReDoc:** `http://localhost:8000/redoc`
- Alternative documentation format
- Better for reading

Both generated from:
- Route function signatures
- Docstrings
- Response models
- Type hints

No manual documentation needed!

## Common Patterns in SoundBoard

### Pattern: Service Layer Separation

```
Routes (api/v1/boards.py)
  ↓
Services (services/board_service.py)
  ↓
Models/Database (models/board.py, db)
```

Routes handle HTTP, services handle business logic, models handle persistence.

### Pattern: Query Building

```python
def list_boards(db, page, size, user_id=None, search=None, tags=None):
    q = db.query(Board)
    
    if user_id:
        q = q.filter(Board.owner_id == user_id)
    
    if search:
        q = q.filter(Board.name.ilike(f"%{search}%"))
    
    items = q.offset((page-1)*size).limit(size).all()
    total = q.count()
    return items, total
```

Dynamic query building based on parameters.

### Pattern: Response Transformation

```python
def _to_board_out(board) -> BoardOut:
    return BoardOut(
        id=board.id,
        name=board.name,
        owner=UserPublic(id=board.owner.id, username=board.owner.username),
        sounds=[SoundOut(...) for sound in board.sounds]
    )
```

Transform ORM models to response schemas.

## Best Practices

1. **Use Type Hints**: FastAPI relies on them for validation
2. **Separate Concerns**: Routes → Services → Models
3. **Validate Input**: Always validate with Pydantic schemas
4. **Document with Docstrings**: Appears in API docs
5. **Use Response Models**: Contracts for API responses
6. **Handle Errors**: Use appropriate HTTP status codes
7. **Use Dependencies**: DRY principle for shared logic
8. **Organize Routers**: Group related endpoints

## Useful Resources

- [FastAPI Official Docs](https://fastapi.tiangolo.com/)
- [Pydantic Docs](https://docs.pydantic.dev/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)

---

**Last Updated**: 2026-04-15
**FastAPI Version**: 0.111.0+
