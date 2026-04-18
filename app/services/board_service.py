from sqlalchemy import cast, func, or_
from sqlalchemy import Text
from sqlalchemy.orm import Session
from app.core.exceptions import not_found, forbidden
from app.models.board import Board
from app.schemas.board import BoardCreate, BoardUpdate


def _base_query(db: Session, user_id: int | None):
    q = db.query(Board)
    if user_id is None:
        q = q.filter(Board.is_public == True)
    return q


def list_boards(
    db: Session,
    page: int,
    size: int,
    user_id: int | None,
    search: str | None = None,
    tags: list[str] | None = None,
) -> tuple[list[Board], int]:
    q = _base_query(db, user_id)
    # If user_id is provided, filter to only that user's boards (not public boards)
    if user_id is not None:
        q = q.filter(Board.owner_id == user_id)

    if search:
        term = f"%{search.lower()}%"
        q = q.filter(
            or_(
                func.lower(Board.name).like(term),
                func.lower(Board.description).like(term),
            )
        )

    if tags:
        # Board must contain ALL requested tags.
        # Tags are stored as a JSON array; cast to TEXT and use LIKE — portable for SQLite & Postgres.
        for tag in tags:
            q = q.filter(func.lower(cast(Board.tags, Text)).contains(f'"{tag.lower()}"'))

    total = q.count()
    items = q.order_by(Board.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return items, total


def get_board(board_id: int, db: Session, user_id: int | None = None) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise not_found("Board")
    if not board.is_public and board.owner_id != user_id:
        raise forbidden()
    return board


def create_board(data: BoardCreate, owner_id: int, db: Session) -> Board:
    board = Board(owner_id=owner_id, **data.model_dump())
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


def update_board(board_id: int, data: BoardUpdate, user_id: int, db: Session) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise not_found("Board")
    if board.owner_id != user_id:
        raise forbidden()
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(board, field, value)
    db.commit()
    db.refresh(board)
    return board


def delete_board(board_id: int, user_id: int, db: Session) -> None:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise not_found("Board")
    if board.owner_id != user_id:
        raise forbidden()
    db.delete(board)
    db.commit()


def get_all_tags(db: Session) -> list[str]:
    """Return all unique tags used across public boards, sorted."""
    boards = db.query(Board.tags).filter(Board.is_public == True).all()
    tag_set: set[str] = set()
    for (tags,) in boards:
        if tags:
            tag_set.update(tags)
    return sorted(tag_set)
