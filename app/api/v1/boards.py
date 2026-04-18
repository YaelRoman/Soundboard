from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_optional_user
from app.models.user import User
from app.schemas.board import BoardCreate, BoardOut, BoardSummary, BoardUpdate
from app.schemas.pagination import Page
from app.schemas.sound import SoundOut
from app.schemas.user import UserPublic
from app.services.board_service import (
    list_boards, get_board, create_board, update_board, delete_board, get_all_tags
)

router = APIRouter(prefix="/boards", tags=["boards"])


def _sound_out(s) -> SoundOut:
    """Build SoundOut from a Sound ORM object, populating stream_url."""
    return SoundOut(
        id=s.id,
        name=s.name,
        filename=s.filename,
        duration_ms=s.duration_ms,
        file_size_bytes=s.file_size_bytes,
        mime_type=s.mime_type,
        stream_url=f"/api/v1/sounds/{s.id}/stream",
        board_id=s.board_id,
        tags=s.tags,
        created_at=s.created_at,
    )


def _owner_out(u) -> UserPublic:
    return UserPublic(
        id=u.id,
        username=u.username,
        avatar_url=u.avatar_url,
    )


def _to_board_out(b) -> BoardOut:
    """Convert Board ORM object → BoardOut, correctly populating stream_url on each sound."""
    return BoardOut(
        id=b.id,
        name=b.name,
        description=b.description,
        is_public=b.is_public,
        tags=b.tags,
        owner=_owner_out(b.owner),
        sounds=[_sound_out(s) for s in b.sounds],
        created_at=b.created_at,
        updated_at=b.updated_at,
    )


def _to_summary(b) -> BoardSummary:
    return BoardSummary(
        id=b.id,
        name=b.name,
        description=b.description,
        is_public=b.is_public,
        tags=b.tags,
        owner=_owner_out(b.owner),
        sound_count=len(b.sounds),
        created_at=b.created_at,
    )


@router.get("/tags", response_model=list[str], tags=["tags"])
def list_tags(db: Session = Depends(get_db)):
    """Return all unique tags used across public boards."""
    return get_all_tags(db)


@router.get("/", response_model=None)
def read_boards(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, description="Search by name or description"),
    tags: list[str] | None = Query(None, description="Filter by tags (all must match)"),
    db: Session = Depends(get_db),
):
    boards, total = list_boards(db, page, size, user_id=None, search=q, tags=tags)
    return Page.create([_to_summary(b) for b in boards], total, page, size)


@router.get("/my", response_model=None)
def read_my_boards(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, description="Search by name or description"),
    tags: list[str] | None = Query(None, description="Filter by tags"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    boards, total = list_boards(db, page, size, user_id=current_user.id, search=q, tags=tags)
    return Page.create([_to_summary(b) for b in boards], total, page, size)


@router.post("/", response_model=None, status_code=201)
def create(
    data: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = create_board(data, current_user.id, db)
    return _to_board_out(board)


@router.get("/{board_id}", response_model=None)
def read_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    return _to_board_out(get_board(board_id, db, user_id=user_id))


@router.put("/{board_id}", response_model=None)
def edit_board(
    board_id: int,
    data: BoardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _to_board_out(update_board(board_id, data, current_user.id, db))


@router.delete("/{board_id}", status_code=204)
def remove_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_board(board_id, current_user.id, db)
