import os
import uuid
import aiofiles
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.config import settings
from app.core.exceptions import not_found, forbidden, bad_request
from app.models.sound import Sound
from app.models.board import Board
from app.schemas.sound import SoundUpdate

ALLOWED_MIME_TYPES = {
    "audio/mpeg", "audio/mp3",               # MP3
    "audio/wav",  "audio/x-wav", "audio/wave", "audio/vnd.wave",  # WAV
    "audio/ogg",  "audio/vorbis",             # OGG
    "audio/flac", "audio/x-flac",             # FLAC
    "audio/aac",  "audio/mp4", "audio/x-m4a", # AAC/M4A
    "audio/webm",                              # WebM audio
}
MAX_BYTES = settings.max_file_size_mb * 1024 * 1024


async def upload_sound(
    file: UploadFile,
    board_id: int,
    name: str,
    tags: list[str],
    user_id: int,
    db: Session,
) -> Sound:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise not_found("Board")
    if board.owner_id != user_id:
        raise forbidden()
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise bad_request(f"File type not allowed. Allowed: mp3, wav, ogg, flac")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise bad_request(f"File exceeds {settings.max_file_size_mb} MB limit")

    ext = os.path.splitext(file.filename or "audio")[1] or ".mp3"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.upload_dir, filename)

    os.makedirs(settings.upload_dir, exist_ok=True)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    sound = Sound(
        board_id=board_id,
        name=name,
        filename=filename,
        file_size_bytes=len(content),
        mime_type=file.content_type,
        tags=tags,
    )
    db.add(sound)
    db.commit()
    db.refresh(sound)
    return sound


def get_sound(sound_id: int, db: Session) -> Sound:
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise not_found("Sound")
    return sound


def get_sound_file_path(sound: Sound) -> str:
    path = os.path.join(settings.upload_dir, sound.filename)
    if not os.path.exists(path):
        raise not_found("Audio file")
    return path


def update_sound(sound_id: int, data: SoundUpdate, user_id: int, db: Session) -> Sound:
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise not_found("Sound")
    if sound.board.owner_id != user_id:
        raise forbidden()
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(sound, field, value)
    db.commit()
    db.refresh(sound)
    return sound


def delete_sound(sound_id: int, user_id: int, db: Session) -> None:
    sound = db.query(Sound).filter(Sound.id == sound_id).first()
    if not sound:
        raise not_found("Sound")
    if sound.board.owner_id != user_id:
        raise forbidden()
    file_path = os.path.join(settings.upload_dir, sound.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    db.delete(sound)
    db.commit()
