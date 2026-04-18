from sqlalchemy.orm import Session
from app.core.exceptions import not_found, conflict
from app.models.user import User
from app.models.board import Board
from app.models.sound import Sound
from app.schemas.user import UserUpdate


def get_user_by_username(username: str, db: Session) -> User:
    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user:
        raise not_found("User")
    return user


def get_public_profile(username: str, db: Session) -> dict:
    user = get_user_by_username(username, db)
    public_boards = db.query(Board).filter(Board.owner_id == user.id, Board.is_public == True).all()
    boards_count = len(public_boards)
    sounds_count = sum(len(b.sounds) for b in public_boards)
    return {
        "id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "boards_count": boards_count,
        "sounds_count": sounds_count,
    }


def get_user_boards(username: str, db: Session) -> list[Board]:
    user = get_user_by_username(username, db)
    return db.query(Board).filter(Board.owner_id == user.id, Board.is_public == True).all()


def update_me(user: User, data: UserUpdate, db: Session) -> User:
    if data.username and data.username != user.username:
        if db.query(User).filter(User.username == data.username).first():
            raise conflict("Username already taken")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
