# Admin Auth Backend (Telegram ID + JWT)

Telegram ID asosidagi admin login flow (Mini App + Web admin panel).

- Admin panel URL: `https://humo-ai.netlify.app/admin`
- Admin Telegram ID: `6067477588`

## File structure

```text
admin-backend/
  config/
    env.js
  auth/
    adminAuthService.js
  routes/
    adminRoutes.js
  middleware/
    verifyAdminToken.js
  server.js
  package.json
  .env.example
```

## Environment

```env
PORT=8080
JWT_SECRET=replace_with_long_secret
ADMIN_TELEGRAM_ID=6067477588
```

## API

### POST `/api/admin/login`
Request:

```json
{
  "telegramId": "6067477588"
}
```

Behavior:
- Telegram ID mos bo'lsa: JWT (`1h`) qaytaradi.
- Mos bo'lmasa: `403 Forbidden`.

Success:
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "expiresIn": "1h"
}
```

Forbidden:
```json
{
  "success": false,
  "message": "Forbidden"
}
```

### GET `/api/admin/me`
- `Authorization: Bearer <token>` talab qiladi.
- Middleware JWT va `telegram_id` claim'ini `ADMIN_TELEGRAM_ID` bilan tekshiradi.

## Mini App integration snippet

```ts
const tgId = String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || '');
if (tgId) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramId: tgId }),
  });

  const data = await res.json();
  if (res.ok && data.success && data.token) {
    localStorage.setItem('admin_jwt_token', data.token);
    // show admin panel
  } else {
    // continue normal mini app flow
  }
}
```

## Flow diagram

```text
Mini App start
   |
   v
Read Telegram user ID
   |
   v
POST /api/admin/login {telegramId}
   |-------------------------|
   | match (6067477588)      | mismatch
   v                         v
JWT (1h)                     403 Forbidden
   |
   v
Render /admin/dashboard      Continue normal app
```
