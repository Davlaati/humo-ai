from datetime import UTC, datetime, timedelta

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .database import get_db, init_db
from .gemini_proxy import dictionary_lookup
from .models import PeriodType, Transaction, TransactionStatus, TransactionType, User, UserLevel
from .schemas import (
    AuthRequest,
    AuthResponse,
    DictionaryLookupRequest,
    DictionaryLookupResponse,
    InvoiceRequest,
    LeaderboardEntry,
    PaymentWebhook,
    ProfileResponse,
    UpdateProgressRequest,
)
from .security import create_access_token, decode_access_token, validate_telegram_init_data

settings = get_settings()
app = FastAPI(title=settings.app_name)


@app.on_event('startup')
async def startup() -> None:
    await init_db()


async def get_current_user(
    authorization: str = Header(default=''), db: AsyncSession = Depends(get_db)
) -> User:
    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token.')
    token = authorization.split(' ', maxsplit=1)[1]
    user_id = decode_access_token(token)
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found.')
    return user


async def apply_streak_and_daily_reward(user: User) -> None:
    now = datetime.now(UTC)
    last_active = user.last_active.replace(tzinfo=UTC) if user.last_active.tzinfo is None else user.last_active
    gap = now - last_active

    if gap > timedelta(hours=48):
        if user.streak_freeze_count > 0:
            user.streak_freeze_count -= 1
        else:
            user.streak = 0

    if user.last_rewarded_at is None or user.last_rewarded_at.date() < now.date():
        user.coins += settings.daily_reward_coins
        user.xp += settings.daily_reward_xp
        user.last_rewarded_at = now

    if last_active.date() < now.date() and gap <= timedelta(hours=48):
        user.streak += 1

    user.last_active = now


@app.post('/auth', response_model=AuthResponse)
async def auth(payload: AuthRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    bot_token = settings.telegram_webapp_bot_token or settings.telegram_bot_token
    if not bot_token:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Telegram bot token not set.')

    user_data = validate_telegram_init_data(payload.init_data, bot_token)
    telegram_id = int(user_data['id'])

    user = await db.scalar(select(User).where(User.id == telegram_id))
    now = datetime.now(UTC)
    if not user:
        user = User(
            id=telegram_id,
            name=user_data.get('first_name', 'Unknown'),
            username=user_data.get('username'),
            joined_at=now,
            last_active=now,
            streak=1,
        )
        db.add(user)
    else:
        user.name = user_data.get('first_name', user.name)
        user.username = user_data.get('username', user.username)
        await apply_streak_and_daily_reward(user)

    await db.commit()
    token = create_access_token(user.id)
    return AuthResponse(access_token=token)


@app.get('/profile', response_model=ProfileResponse)
async def profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> ProfileResponse:
    await apply_streak_and_daily_reward(current_user)
    await db.commit()
    return ProfileResponse.model_validate(current_user, from_attributes=True)


@app.post('/update-progress')
async def update_progress(
    payload: UpdateProgressRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await apply_streak_and_daily_reward(current_user)
    current_user.xp += payload.earned_xp
    current_user.coins += payload.earned_coins

    if current_user.xp >= 1500:
        current_user.level = UserLevel.advanced
    elif current_user.xp >= 600:
        current_user.level = UserLevel.intermediate
    else:
        current_user.level = UserLevel.beginner

    await db.commit()
    return {'message': 'Progress updated', 'xp': current_user.xp, 'coins': current_user.coins}


@app.get('/leaderboard', response_model=list[LeaderboardEntry])
async def leaderboard(
    period: PeriodType = PeriodType.overall,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> list[LeaderboardEntry]:
    if period == PeriodType.weekly:
        start = datetime.now(UTC) - timedelta(days=7)
        stmt = (
            select(User.id, User.name, User.username, func.max(User.xp).label('xp'))
            .join(Transaction, Transaction.user_id == User.id, isouter=True)
            .where(User.last_active >= start)
            .group_by(User.id)
            .order_by(desc('xp'))
            .limit(limit)
        )
    elif period == PeriodType.monthly:
        start = datetime.now(UTC) - timedelta(days=30)
        stmt = select(User.id, User.name, User.username, User.xp).where(User.last_active >= start).order_by(desc(User.xp)).limit(limit)
    else:
        stmt = select(User.id, User.name, User.username, User.xp).order_by(desc(User.xp)).limit(limit)

    rows = (await db.execute(stmt)).all()
    return [
        LeaderboardEntry(rank=index + 1, user_id=row[0], name=row[1], username=row[2], xp=row[3])
        for index, row in enumerate(rows)
    ]


@app.post('/dictionary/lookup', response_model=DictionaryLookupResponse)
async def dictionary(
    payload: DictionaryLookupRequest,
    current_user: User = Depends(get_current_user),
) -> DictionaryLookupResponse:
    result = await dictionary_lookup(current_user, payload.word)
    return DictionaryLookupResponse(**result)


@app.post('/payments/invoice')
async def create_invoice(
    payload: InvoiceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    prices = [{'label': 'Premium Monthly', 'amount': 150}] if payload.item == 'premium' else [{'label': '100 Stars Pack', 'amount': 100}]
    invoice_payload = f'humo:{payload.item}:{current_user.id}:{int(datetime.now(UTC).timestamp())}'

    url = f'https://api.telegram.org/bot{settings.telegram_bot_token}/createInvoiceLink'
    body = {
        'title': 'HUMO AI Purchase',
        'description': f'Purchase {payload.item}',
        'payload': invoice_payload,
        'currency': 'XTR',
        'prices': prices,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, json=body)
            response.raise_for_status()
        telegram_data = response.json()
        if not telegram_data.get('ok'):
            raise ValueError(telegram_data)
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Failed to create invoice link.') from exc

    trx = Transaction(
        user_id=current_user.id,
        type=TransactionType.purchase,
        amount=prices[0]['amount'],
        currency='XTR',
        status=TransactionStatus.pending,
        payload=invoice_payload,
    )
    db.add(trx)
    await db.commit()
    return {'invoice_link': telegram_data['result'], 'payload': invoice_payload}


@app.post('/payments/webhook')
async def successful_payment_webhook(
    payload: PaymentWebhook,
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await db.scalar(select(User).where(User.id == payload.user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    if 'premium' in payload.payload:
        user.is_premium = True
    else:
        user.telegram_stars += payload.amount

    trx = Transaction(
        user_id=user.id,
        type=TransactionType.purchase,
        amount=payload.amount,
        currency=payload.currency,
        status=TransactionStatus.success,
        provider_charge_id=payload.provider_charge_id,
        payload=payload.payload,
    )
    db.add(trx)
    await db.commit()
    return {'message': 'Payment processed'}
