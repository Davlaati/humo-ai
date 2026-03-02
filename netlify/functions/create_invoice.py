
import asyncio
import json
import os
from aiogram import Bot
from aiogram.types import LabeledPrice

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
bot = Bot(token=TOKEN) if TOKEN else None

async def main(event):
    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    if not bot:
        return {"statusCode": 500, "body": "Bot token not configured"}

    try:
        body = json.loads(event.get("body", "{}"))
        user_id = body.get("user_id")
        
        if not user_id:
            return {"statusCode": 400, "body": json.dumps({"error": "user_id is required"})}

        # Create invoice link for 231 Stars (approx $3)
        invoice_link = await bot.create_invoice_link(
            title="Ravona Premium",
            description="Barcha premium imkoniyatlarni 1 oyga faollashtirish",
            payload=f"premium_{user_id}",
            provider_token="", # SHART: Stars uchun bo'sh bo'lishi kerak
            currency="XTR",
            prices=[
                LabeledPrice(label="Premium Obuna", amount=231)
            ]
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"url": invoice_link})
        }
    except Exception as e:
        print(f"Error creating invoice link: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

def handler(event, context):
    return asyncio.run(main(event))
