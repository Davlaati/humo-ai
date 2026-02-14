# HUMO AI Backend Extension (Leaderboard + Premium + Settings)

This backend now supports:
- Real user-based leaderboard (weekly, monthly, all-time)
- Lesson points sync
- Premium subscription requests (receipt upload flow)
- Admin approval/rejection for subscriptions
- Dynamic loading logo setting
- Existing Telegram Stars payment module (demo/real) kept for merchant logic

## Env
```env
PORT=8080
JWT_SECRET=replace_with_long_secret
ADMIN_TELEGRAM_ID=6067477588
PAYMENT_MODE=demo
TELEGRAM_BOT_TOKEN=replace_in_real_mode
TELEGRAM_WEBHOOK_SECRET=replace_with_random_secret
```

## Public API
- `POST /api/public/lesson/complete` body `{ telegramId, points }`
- `GET /api/public/leaderboard?period=weekly|monthly|alltime&limit=100&telegramId=...`
- `POST /api/public/subscriptions` body `{ telegramId, username, planType: "7d|1m|1y", proofImage }`
- `GET /api/public/users/me?telegramId=...`
- `GET /api/public/settings/loading-logo`

## Admin API
- `POST /api/admin/login`
- `GET /api/admin/users`
- `GET /api/admin/payments`
- `GET /api/admin/stats`
- `GET /api/admin/subscriptions/pending`
- `POST /api/admin/subscriptions/:id/approve`
- `POST /api/admin/subscriptions/:id/reject`
- `POST /api/admin/leaderboard/reset-weekly`
- `POST /api/admin/settings/loading-logo` body `{ imageUrl }`

## Premium plans
- 7 days: 15,000 UZS
- 1 month: 55,000 UZS
- 1 year: 550,000 UZS

## Webhook simulation (existing Stars module)
```bash
curl -X POST http://localhost:8080/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: replace_with_random_secret" \
  -d '{"message":{"successful_payment":{"invoice_payload":"stars_payment:1:6067477588","telegram_payment_charge_id":"sim_charge_123"}}}'
```
