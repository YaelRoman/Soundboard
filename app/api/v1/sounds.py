from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.config import settings
from app.models.user import User
from app.schemas.sound import SoundOut, SoundUpdate
from app.services.sound_service import (
    upload_sound, get_sound, get_sound_file_path, update_sound, delete_sound
)

router = APIRouter(prefix="/sounds", tags=["sounds"])


def _to_out(sound) -> SoundOut:
    return SoundOut(
        id=sound.id,
        name=sound.name,
        filename=sound.filename,
        duration_ms=sound.duration_ms,
        file_size_bytes=sound.file_size_bytes,
        mime_type=sound.mime_type,
        stream_url=f"/api/v1/sounds/{sound.id}/stream",
        board_id=sound.board_id,
        tags=sound.tags,
        created_at=sound.created_at,
    )


@router.post("/upload", response_model=SoundOut, status_code=201)
async def upload(
    file: UploadFile = File(...),
    board_id: int = Form(...),
    name: str = Form(...),
    tags: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sound = await upload_sound(file, board_id, name, tags, current_user.id, db)
    return _to_out(sound)


@router.get("/{sound_id}", response_model=SoundOut)
def read_sound(sound_id: int, db: Session = Depends(get_db)):
    return _to_out(get_sound(sound_id, db))


@router.get("/{sound_id}/stream")
def stream_sound(sound_id: int, db: Session = Depends(get_db)):
    sound = get_sound(sound_id, db)
    path = get_sound_file_path(sound)
    return FileResponse(
        path=path,
        media_type=sound.mime_type,
        headers={"Accept-Ranges": "bytes"},
    )


@router.put("/{sound_id}", response_model=SoundOut)
def edit_sound(
    sound_id: int,
    data: SoundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _to_out(update_sound(sound_id, data, current_user.id, db))


@router.delete("/{sound_id}", status_code=204)
def remove_sound(
    sound_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_sound(sound_id, current_user.id, db)
