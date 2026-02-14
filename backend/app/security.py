import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qsl

import jwt
from fastapi import HTTPException, status

from .config import get_settings

settings = get_settings()


def _build_data_check_string(init_data: str) -> tuple[str, str]:
    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop('hash', None)
    if not received_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing Telegram hash.')

    data_check_string = '\n'.join(f'{k}={v}' for k, v in sorted(parsed.items(), key=lambda item: item[0]))
    return data_check_string, received_hash


def validate_telegram_init_data(init_data: str, bot_token: str) -> dict:
    data_check_string, received_hash = _build_data_check_string(init_data)

    secret_key = hmac.new(b'WebAppData', bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Telegram signature.')

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    auth_date = int(parsed.get('auth_date', '0'))
    if datetime.now(UTC) - datetime.fromtimestamp(auth_date, tz=UTC) > timedelta(days=1):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Expired initData.')

    user_raw = parsed.get('user')
    if not user_raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing user payload in initData.')

    return json.loads(user_raw)


def create_access_token(user_id: int) -> str:
    expires = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {'sub': str(user_id), 'exp': expires}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return int(payload['sub'])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token.') from exc
