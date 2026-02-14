from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', case_sensitive=False)

    app_name: str = 'HUMO AI Backend'
    environment: str = 'development'
    secret_key: str = Field(default='change-me', min_length=16)
    jwt_algorithm: str = 'HS256'
    jwt_expire_minutes: int = 60 * 24

    database_url: str = 'postgresql+asyncpg://postgres:postgres@localhost:5432/humo_ai'

    telegram_bot_token: str = ''
    telegram_webapp_bot_token: str = ''

    gemini_api_key: str = ''
    gemini_model: str = 'gemini-1.5-flash'

    daily_reward_coins: int = 25
    daily_reward_xp: int = 10


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
