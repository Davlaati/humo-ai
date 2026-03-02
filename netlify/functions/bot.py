import asyncio
import json
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import LabeledPrice, PreCheckoutQuery, Message

# --- SOZLAMALAR ---
# Tokenni Netlify Environment Variables orqali olamiz
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
PREMIUM_STARS_AMOUNT = 231

# Bot va Dispatcher obyektlarini yaratish
# Serverless muhitda har bir so'rov yangi bo'lishi mumkin, shuning uchun global obyektlar
# faqat bir so'rov davomida ishlatiladi.
bot = Bot(token=TOKEN) if TOKEN else None
dp = Dispatcher()


async def activate_premium_for_user(user_id: str, amount: int):
    """
    Premium faollashtirish logikasi uchun entry point.
    Hozircha audit log yoziladi; shu joydan DB update qilinadi.
    """
    print(f"Premium activated for user={user_id}, amount={amount}")


async def create_stars_invoice_link(user_id: str):
    """
    Telegram Stars uchun invoice link yaratish.
    currency='XTR' va provider_token='' bo'lishi majburiy.
    """
    if not bot:
        raise RuntimeError("Bot token not configured")

    payload = f"premium_{user_id}"
    return await bot.create_invoice_link(
        title="Ravona Premium",
        description="Premium xususiyatlarga kirish va cheklovlarni olib tashlash.",
        payload=payload,
        currency="XTR",
        provider_token="",
        prices=[LabeledPrice(label="Premium Obuna", amount=PREMIUM_STARS_AMOUNT)],
    )

# --- HANDLERLAR (Stars va Buyruqlar) ---

@dp.message(Command("start"))
async def start_handler(message: Message):
    """
    /start buyrug'iga javob
    """
    await message.answer(
        "👋 Salom! Men Ravona AI botiman.\n"
        "Premium obuna sotib olish uchun /buy buyrug'ini yuboring."
    )

@dp.message(Command("buy", "premium"))
async def buy_handler(message: Message):
    """
    Foydalanuvchiga Stars invoice (to'lov cheki) yuborish
    """
    await message.answer_invoice(
        title="Ravona Premium",
        description="Premium xususiyatlarga kirish va cheklovlarni olib tashlash.",
        payload=f"premium_{message.from_user.id}", # To'lovchi ID si payload da
        currency="XTR", # Telegram Stars valyutasi
        provider_token="", # Stars uchun bo'sh bo'lishi SHART
        prices=[
            LabeledPrice(label="Premium Obuna", amount=PREMIUM_STARS_AMOUNT)
        ],
        start_parameter="buy_premium",
        is_flexible=False
    )

@dp.pre_checkout_query()
async def pre_checkout_handler(query: PreCheckoutQuery):
    """
    To'lovdan oldingi tekshiruv. 10 soniya ichida javob berish shart.
    """
    # Bu yerda mahsulot borligini tekshirish mumkin.
    # Stars uchun har doim ok=True qaytaramiz.
    await query.answer(ok=True)

@dp.message(F.successful_payment)
async def success_payment_handler(message: Message):
    """
    Muvaffaqiyatli to'lov qabul qilinganda
    """
    payment_info = message.successful_payment
    amount = payment_info.total_amount
    user_id = str(message.from_user.id) if message.from_user else "unknown"

    # Premium faollashtirish logikasi (DB / billing sync shu yerga ulanadi)
    await activate_premium_for_user(user_id=user_id, amount=amount)

    await message.answer(
        f"🎉 To'lov muvaffaqiyatli amalga oshirildi!\n"
        f"Siz {amount} Stars to'ladingiz. Premium status faollashtirildi."
    )

# --- NETLIFY FUNCTION HANDLER ---

async def main(event):
    """
    Asosiy async logika
    """
    # Faqat POST so'rovlarni qabul qilamiz
    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    if not bot:
        return {"statusCode": 500, "body": "Bot token not configured"}

    try:
        # Telegramdan kelgan JSON ni o'qish
        body = json.loads(event.get("body", "{}"))

        if body.get("action") == "create_invoice_link":
            user_id = str(body.get("userId") or "")
            if not user_id:
                return {
                    "statusCode": 400,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "userId is required"}),
                }

            invoice_link = await create_stars_invoice_link(user_id)
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"invoiceLink": invoice_link}),
            }

        # Update obyektiga o'tkazish
        update = types.Update(**body)

        # Dispatcher orqali update ni ishlash
        await dp.feed_update(bot, update)

        return {"statusCode": 200, "body": "OK"}
    except Exception as e:
        print(f"Error processing update: {e}")
        return {"statusCode": 200, "body": "OK"} # Telegramga xato qaytarmaslik kerak, aks holda qayta yuboraveradi

def handler(event, context):
    """
    Netlify (AWS Lambda) uchun kirish nuqtasi
    """
    return asyncio.run(main(event))
