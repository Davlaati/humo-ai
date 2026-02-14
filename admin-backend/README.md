# HUMO AI Admin Backend (Express + PostgreSQL)

Scalable, modular Admin Panel backend for Telegram Mini App.

## Architecture
- Clean modular split:
  - `controllers/`
  - `services/`
  - `repositories/`
  - `middlewares/`
  - `routes/`
- JWT admin authentication + RBAC middleware.
- SQL injection protection via parameterized `pg` queries.
- Validation via `zod`.

## Run
```bash
cd admin-backend
npm install
cp .env.example .env
npm run dev
```

## DB
Run `src/db/schema.sql` on PostgreSQL.

## Implemented API
- `POST /admin/login`
- `POST /admin/logout`
- `GET /admin/users`
- `GET /admin/users/:id`
- `PATCH /admin/users/:id`
- `POST /admin/users/:id/ban`
- `POST /admin/users/:id/unban`
- `GET /admin/payments`
- `POST /admin/payments/:id/verify`
- `POST /admin/payments/:id/refund`
- `GET /admin/ai-usage`
- `GET /admin/ai-usage/:userId`
- `GET /admin/settings`
- `PATCH /admin/settings`
- `GET /admin/logs`
- `GET /admin/admin-logs`

## Failure-mode handling
- **Payment double verify**: idempotent service returns `idempotent: true` if already paid.
- **Admin token theft**: short expiry + `ADMIN_TOKEN_VERSION` rotation for global revocation.
- **Database down**: app startup health check fails fast; all queries centralized via repository layer.
- **AI abuse**: `warning_flag` from high token usage, with room for auto-block worker.
- **100k users**: pagination on list endpoints + indexes in SQL schema.
- **Queue/backup**: Redis queue hook planned via `.env` and modular service structure.
