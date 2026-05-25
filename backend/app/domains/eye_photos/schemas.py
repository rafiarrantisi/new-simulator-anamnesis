"""Schemas eye_photos (kontrak v0.15.0)."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

EyeLit = Literal["OD", "OS", "OU", ""]


class EyePhotoOut(BaseModel):
    """Shape compatible dgn manifest.json frontend v0.14.0.

    `src` = absolute URL (cocok utk <img src=...>) → frontend tak perlu
    resolve path. Bentuk array ini dipakai `__loadEyePhotosForCase` di
    frontend (eye-photo.jsx).
    """
    id: str
    caseId: str
    src: str        # /api/uploads/eye-photos/{filename} (absolute under same origin)
    caption: str = ""
    eye: EyeLit = ""
    ord: int = 0
    uploaded_at: datetime


class EyePhotoAdminOut(EyePhotoOut):
    """Sama + field admin (filename mentah utk debug, uploader)."""
    filename: str
    uploaded_by: str | None = None


class EyePhotoUpdate(BaseModel):
    caption: str | None = None
    eye: EyeLit | None = None
    ord: int | None = Field(default=None, ge=0)
