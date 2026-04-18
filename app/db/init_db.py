from app.db.base import Base
from app.db.session import engine
from app.models import user, board, sound  # noqa: F401 — registers models


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
