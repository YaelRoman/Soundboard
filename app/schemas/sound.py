from datetime import datetime
from pydantic import BaseModel


class SoundOut(BaseModel):
    id: int
    name: str
    filename: str
    duration_ms: int | None
    file_size_bytes: int
    mime_type: str
    stream_url: str
    board_id: int
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SoundUpdate(BaseModel):
    name: str | None = None
    tags: list[str] | None = None
