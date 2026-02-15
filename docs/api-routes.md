# API Routes (Production Contract)

## Leaderboard
- `GET /api/leaderboard?period=weekly|monthly|alltime`
- `POST /api/admin/leaderboard/reset-weekly`
- `GET /api/admin/leaderboard/top?period=alltime&limit=100`

## Subscriptions
- `POST /api/subscriptions` (create pending request with proof image URL)
- `GET /api/admin/subscriptions?status=pending`
- `POST /api/admin/subscriptions/:id/approve`
- `POST /api/admin/subscriptions/:id/reject`

## App Settings
- `GET /api/settings/loading-logo`
- `PUT /api/admin/settings/loading-logo`

## Example Response
```json
{
  "id": "sub_123",
  "user_id": "u_1",
  "plan_type": "1m",
  "price": 55000,
  "status": "pending",
  "proof_image": "https://cdn.example.com/receipt.jpg",
  "expires_at": null,
  "created_at": "2026-02-15T09:00:00Z"
}
```
