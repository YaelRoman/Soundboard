from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserOut, UserPublic, UserUpdate
from app.schemas.board import BoardSummary
from app.schemas.pagination import Page
from app.services.user_service import get_public_profile, get_user_boards, update_me

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def edit_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_me(current_user, data, db)


@router.get("/{username}", response_model=UserPublic)
def read_user(username: str, db: Session = Depends(get_db)):
    return UserPublic.model_validate(get_public_profile(username, db))


@router.get("/{username}/boards", response_model=list[BoardSummary])
def read_user_boards(username: str, db: Session = Depends(get_db)):
    boards = get_user_boards(username, db)
    return [
        BoardSummary.model_validate({
            "id": b.id,
            "name": b.name,
            "description": b.description,
            "is_public": b.is_public,
            "tags": b.tags,
            "owner": b.owner,
            "sound_count": len(b.sounds),
            "created_at": b.created_at,
        })
        for b in boards
    ]
