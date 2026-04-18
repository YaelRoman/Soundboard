from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.exceptions import unauthorized
from app.schemas.auth import Token
from app.schemas.user import UserCreate
from app.services.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user, access_token, refresh_token = register_user(data, db)
    return Token(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm uses 'username' field; we treat it as email
    user, access_token, refresh_token = login_user(form.username, form.password, db)
    return Token(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/refresh", response_model=Token)
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    from app.models.user import User
    user_id = decode_token(refresh_token)
    if user_id is None:
        raise unauthorized()
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise unauthorized()
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=user,
    )
