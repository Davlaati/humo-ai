# Telegram Stars Payment System (Mini App + Admin)

Fully functional Stars merchant flow with **demo/simulation** and **real** mode.

## Features
- Telegram ID based admin auth (JWT, 1h)
- Bot merchant payment via Telegram invoice link
- Demo mode payment simulation
- Real mode payment + webhook handling
- Duplicate payment protection
- Admin endpoints for users/payments/stats/manual verify
- Balances and transactions initialized from **0 today** (demo JSON store resets daily)

## Config (`.env`)
```env
PORT=8080
JWT_SECRET=replace_with_long_secret
ADMIN_TELEGRAM_ID=6067477588
PAYMENT_MODE=demo
TELEGRAM_BOT_TOKEN=replace_in_real_mode
TELEGRAM_WEBHOOK_SECRET=replace_with_random_secret
```

## API

### Admin auth
- `POST /api/admin/login` body: `{ "telegramId": "6067477588" }`
- `GET /api/admin/me` with bearer token

### Payments (Mini App)
- `POST /api/payments/create-invoice`
  - body: `{ "telegramId": "...", "username": "...", "packageKey": "s50|s100|s250|s500" }`
- `GET /api/payments/balance/:telegramId`
- `POST /api/payments/simulate-success` (demo only)

### Telegram webhook
- `POST /api/telegram/webhook`
  - validates `x-telegram-bot-api-secret-token` if configured
  - handles `pre_checkout_query`
  - handles `successful_payment`

### Admin panel data
- `GET /api/admin/users`
- `GET /api/admin/payments`
- `GET /api/admin/stats`
- `POST /api/admin/payments/:id/verify`

## Webhook simulation curl
```bash
curl -X POST http://localhost:8080/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: replace_with_random_secret" \
  -d '{
    "message": {
      "successful_payment": {
        "invoice_payload": "stars_payment:1:6067477588",
        "telegram_payment_charge_id": "sim_charge_123"
      }
    }
  }'
```

## Demo vs Real mode
- `PAYMENT_MODE=demo`
  - `create-invoice` returns simulation payload
  - use `/api/payments/simulate-success` to mark paid
- `PAYMENT_MODE=real`
  - calls Telegram `createInvoiceLink`
  - Telegram webhook updates DB

## Data model (reference)
See `admin-backend/db/schema.sql`.

## Mini App flow
1. User taps **Buy Stars** in wallet.
2. Frontend calls `/api/payments/create-invoice`.
3. Demo: simulate success endpoint; Real: `openInvoice(invoiceLink)`.
4. Webhook / simulation marks payment paid.
5. User balance refreshed from `/api/payments/balance/:telegramId`.

## Admin flow
1. Admin opens `/admin` inside Mini App.
2. Telegram ID is auto-read and sent to `/api/admin/login`.
3. JWT stored in localStorage.
4. `/admin/dashboard` shows users, payments, stats.
5. Logout clears token and returns to Mini App home.
