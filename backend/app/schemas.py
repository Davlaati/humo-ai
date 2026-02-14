from datetime import datetime

from pydantic import BaseModel, Field

from .models import UserLevel


class AuthRequest(BaseModel):
    init_data: str = Field(..., description='Telegram WebApp initData string')


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class UpdateProgressRequest(BaseModel):
    lesson_id: str
    earned_xp: int = Field(ge=0, le=500)
    earned_coins: int = Field(ge=0, le=500)


class ProfileResponse(BaseModel):
    id: int
    name: str
    username: str | None
    level: UserLevel
    goal: str | None
    interests: list[str]
    coins: int
    xp: int
    streak: int
    is_premium: bool
    telegram_stars: int
    joined_at: datetime
    last_active: datetime


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    name: str
    username: str | None
    xp: int


class DictionaryLookupRequest(BaseModel):
    word: str = Field(min_length=1, max_length=128)


class DictionaryLookupResponse(BaseModel):
    word: str
    translation: str
    example: str | None = None
    source: str


class InvoiceRequest(BaseModel):
    item: str = Field(pattern='^(premium|stars_pack)$')


class PaymentWebhook(BaseModel):
    user_id: int
    payload: str
    amount: int
    currency: str = 'XTR'
    provider_charge_id: str
