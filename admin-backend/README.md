# HUMO AI Backend (Refactor: Rating + Premium Subscription)

This backend supports:
- Telegram ID admin auth (`/api/admin/login`)
- Dynamic leaderboard (weekly/monthly/alltime)
- Premium subscription moderation flow (pending/approved/rejected)
- App settings (e.g. loading logo URL)
- Existing payment/webhook routes kept for compatibility

## New Core API Routes

### Leaderboard
- `GET /api/admin/leaderboard/top?period=weekly|monthly|alltime` (top 100)
- `POST /api/admin/leaderboard/reset-weekly`

### Subscription moderation
- `GET /api/admin/subscriptions?status=pending|approved|rejected`
- `POST /api/admin/subscriptions`  
  body: `{ userId, planType: '7d'|'1m'|'1y', price, proofImage }`
- `POST /api/admin/subscriptions/:id/review`  
  body: `{ status: 'approved'|'rejected' }`

### App settings
- `POST /api/admin/app-settings`  
  body: `{ key: 'loading_logo', value: 'https://...' }`

## DB Schema
See `admin-backend/db/schema.sql`:
- `users` (points_total/weekly/monthly, premium flags)
- `subscriptions`
- `app_settings`
- `payments`
- `admin_logs`

## Example responses

`GET /api/admin/leaderboard/top?period=weekly`
```json
{
  "success": true,
  "users": [
    { "rank": 1, "username": "user1", "points": 520 }
  ]
}
```

`POST /api/admin/subscriptions/:id/review`
```json
{
  "success": true,
  "subscription": {
    "id": 12,
    "status": "approved",
    "expires_at": "2026-03-18T08:00:00.000Z"
  }
}
```
