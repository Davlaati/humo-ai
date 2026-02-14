import json
from datetime import UTC, datetime, timedelta

import httpx
from fastapi import HTTPException, status

from .config import get_settings
from .models import User

settings = get_settings()

_CACHE: dict[str, tuple[dict, datetime]] = {}
_CACHE_TTL = timedelta(minutes=30)


def _cache_key(user_id: int, word: str) -> str:
    return f'{user_id}:{word.lower().strip()}'


async def dictionary_lookup(user: User, word: str) -> dict:
    key = _cache_key(user.id, word)
    cached = _CACHE.get(key)
    if cached and cached[1] > datetime.now(UTC):
        return {**cached[0], 'source': 'cache'}

    if not settings.gemini_api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail='Gemini API key is not configured.')

    system_context = (
        f'You are HUMO AI mentor. User level: {user.level.value}. '
        f'User interests: {", ".join(user.interests) if user.interests else "General English"}. '
        'Return strict JSON with keys translation and example.'
    )
    prompt = f"Translate and explain this word for learning: '{word}'. Keep it beginner-friendly."

    payload = {
        'contents': [
            {
                'parts': [
                    {'text': system_context},
                    {'text': prompt},
                ]
            }
        ],
        'generationConfig': {'temperature': 0.2, 'response_mime_type': 'application/json'},
    }

    url = f'https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent'
    params = {'key': settings.gemini_api_key}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(url, params=params, json=payload)
            response.raise_for_status()
        data = response.json()
        text = data['candidates'][0]['content']['parts'][0]['text']
        parsed = json.loads(text)
        result = {
            'word': word,
            'translation': parsed.get('translation', ''),
            'example': parsed.get('example'),
            'source': 'gemini',
        }
        _CACHE[key] = (result, datetime.now(UTC) + _CACHE_TTL)
        return result
    except (httpx.HTTPError, KeyError, IndexError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Gemini proxy call failed.') from exc
