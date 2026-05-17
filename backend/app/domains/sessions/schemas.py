from pydantic import BaseModel


class StartSessionRequest(BaseModel):
    case_id: str
    mode: str = "normal"  # normal|tutorial|osce


class TurnRequest(BaseModel):
    text: str


class PatchSessionRequest(BaseModel):
    status: str  # active|completed
