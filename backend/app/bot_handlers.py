from datetime import UTC, datetime

from aiogram import Bot, F, Router
from aiogram.methods import AnswerPreCheckoutQuery
from aiogram.types import Message, PreCheckoutQuery
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Transaction, TransactionStatus, TransactionType, User

router = Router(name='payments')


@router.pre_checkout_query()
async def pre_checkout_handler(pre_checkout_query: PreCheckoutQuery, bot: Bot) -> None:
    """Approve Telegram Stars payment after minimal payload verification."""
    is_valid_payload = pre_checkout_query.invoice_payload.startswith('humo:')
    await bot(AnswerPreCheckoutQuery(pre_checkout_query_id=pre_checkout_query.id, ok=is_valid_payload))


@router.message(F.successful_payment)
async def successful_payment_handler(message: Message, db: AsyncSession) -> None:
    payment = message.successful_payment
    if not payment:
        return

    user_id = message.from_user.id
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        user = User(
            id=user_id,
            name=message.from_user.full_name,
            username=message.from_user.username,
            joined_at=datetime.now(UTC),
            last_active=datetime.now(UTC),
        )
        db.add(user)

    payload = payment.invoice_payload
    if 'premium' in payload:
        user.is_premium = True
    else:
        # Telegram passes the smallest currency unit; for XTR it's already integer stars.
        user.telegram_stars += payment.total_amount

    trx = Transaction(
        user_id=user_id,
        type=TransactionType.purchase,
        amount=payment.total_amount,
        currency=payment.currency,
        status=TransactionStatus.success,
        provider_charge_id=payment.telegram_payment_charge_id,
        payload=payload,
    )
    db.add(trx)
    await db.commit()
