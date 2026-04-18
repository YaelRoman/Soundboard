from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import conflict, unauthorized
from app.models.user import User
from app.schemas.user import UserCreate


def register_user(data: UserCreate, db: Session) -> tuple[User, str, str]:
    if db.query(User).filter(User.email == data.email).first():
        raise conflict("Email already registered")
    if db.query(User).filter(User.username == data.username).first():
        raise conflict("Username already taken")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, create_access_token(user.id), create_refresh_token(user.id)


def login_user(email: str, password: str, db: Session) -> tuple[User, str, str]:
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user or not verify_password(password, user.hashed_password):
        raise unauthorized()
    return user, create_access_token(user.id), create_refresh_token(user.id)
