from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = ""
    nim: str = ""
    institution_id: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthSession(BaseModel):
    token: str
    refresh_token: str
    user_id: str
    email: str
    role: str
    institution_id: str
