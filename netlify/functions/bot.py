import asyncio
import json
import os
from urllib import request
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import LabeledPrice, PreCheckoutQuery, Message

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
PREMIUM_STARS_AMOUNT = 150

bot = Bot(token=TOKEN) if TOKEN else None
dp = Dispatcher()


async def activate_premium_for_user(user_id: str, amount: int):
    """
    successful_payment dan keyin premium statusni DB'da faollashtirish.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print(f"Supabase env missing. Premium event: user={user_id}, amount={amount}")
        return

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/profiles?id=eq.{user_id}"
    payload = json.dumps({"is_premium": True}).encode("utf-8")

    req = request.Request(
        endpoint,
        data=payload,
        method="PATCH",
        headers={
            "Content-Type": "application/json",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Prefer": "return=minimal",
        },
    )

    with request.urlopen(req, timeout=10) as response:
        if response.status >= 400:
            raise RuntimeError(f"Supabase premium update failed: {response.status}")


async def create_stars_invoice_link():
    """
    Telegram Stars invoice link yaratish.
    """
    if not bot:
        raise RuntimeError("Bot token not configured")

    return await bot.create_invoice_link(
        title="Ravona AI Premium",
        description="1 Month of unrestricted access to the AI Speaking Club and Smart Dictionary.",
        payload="premium_1_month",
        currency="XTR",
        provider_token="",
        prices=[LabeledPrice(label="1 Month Premium", amount=PREMIUM_STARS_AMOUNT)],
    )


@dp.message(Command("start"))
async def start_handler(message: Message):
    await message.answer(
        "👋 Salom! Men Ravona AI botiman.\n"
        "Premium obuna sotib olish uchun /buy buyrug'ini yuboring."
    )


@dp.message(Command("buy", "premium"))
async def buy_handler(message: Message):
    await message.answer_invoice(
        title="Ravona AI Premium",
        description="1 Month of unrestricted access to the AI Speaking Club and Smart Dictionary.",
        payload="premium_1_month",
        currency="XTR",
        provider_token="",
        prices=[LabeledPrice(label="1 Month Premium", amount=PREMIUM_STARS_AMOUNT)],
        start_parameter="buy_premium",
        is_flexible=False,
    )


@dp.pre_checkout_query()
async def pre_checkout_handler(query: PreCheckoutQuery):
    await query.answer(ok=True)


@dp.message(F.successful_payment)
async def success_payment_handler(message: Message):
    payment_info = message.successful_payment
    amount = payment_info.total_amount
    user_id = str(message.from_user.id) if message.from_user else "unknown"

    await activate_premium_for_user(user_id=user_id, amount=amount)

    await message.answer(
        f"🎉 To'lov muvaffaqiyatli amalga oshirildi!\n"
        f"Siz {amount} Stars to'ladingiz. Premium status faollashtirildi."
    )


async def main(event):
    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    if not bot:
        return {"statusCode": 500, "body": "Bot token not configured"}

    try:
        body = json.loads(event.get("body", "{}"))

        if body.get("action") == "create_invoice_link":
            invoice_link = await create_stars_invoice_link()
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"invoiceLink": invoice_link}),
            }

        update = types.Update(**body)
        await dp.feed_update(bot, update)
        return {"statusCode": 200, "body": "OK"}
    except Exception as e:
        print(f"Error processing update: {e}")
        return {"statusCode": 200, "body": "OK"}


def handler(event, context):
    return asyncio.run(main(event))
