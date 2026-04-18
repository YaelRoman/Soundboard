from datetime import datetime
from pydantic import BaseModel, field_validator
from app.schemas.user import UserPublic
from app.schemas.sound import SoundOut


class BoardCreate(BaseModel):
    name: str
    description: str | None = None
    is_public: bool = True
    tags: list[str] = []

    @field_validator("name")
    @classmethod
    def name_length(cls, v: str) -> str:
        if len(v.strip()) < 1:
            raise ValueError("Board name cannot be empty")
        if len(v) > 100:
            raise ValueError("Board name cannot exceed 100 characters")
        return v.strip()

    @field_validator("tags")
    @classmethod
    def tags_limit(cls, v: list[str]) -> list[str]:
        if len(v) > 10:
            raise ValueError("Maximum 10 tags per board")
        return [t.lower().strip() for t in v if t.strip()]


class BoardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_public: bool | None = None
    tags: list[str] | None = None


class BoardOut(BaseModel):
    id: int
    name: str
    description: str | None
    is_public: bool
    tags: list[str]
    owner: UserPublic
    sounds: list[SoundOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BoardSummary(BaseModel):
    id: int
    name: str
    description: str | None
    is_public: bool
    tags: list[str]
    owner: UserPublic
    sound_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
