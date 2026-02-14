# Admin Auth Backend (Node.js + Express)

Secure admin login system for HUMO AI admin panel.

Admin panel UI: `https://humo-ai.netlify.app/admin`

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
  scripts/
    generate-admin-hash.js
  server.js
  package.json
  .env.example
```

## Setup

```bash
cd admin-backend
npm install
npm run generate:admin-hash
# copy the generated hash into .env as ADMIN_PASSWORD_HASH
cp .env.example .env
npm run dev
```

## Environment variables

- `ADMIN_LOGIN`
- `ADMIN_PASSWORD_HASH`
- `JWT_SECRET`
- `PORT`

## API

### `POST /api/admin/login`

Request:

```json
{
  "login": "337520209",
  "password": "Davlatbek09"
}
```

Success response:

```json
{
  "success": true,
  "token": "JWT_TOKEN"
}
```

Failed response:

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Example curl

```bash
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"login":"337520209","password":"Davlatbek09"}'
```

## Route protection

All routes under `/api/admin/*` except `/api/admin/login` are protected by `verifyAdminToken` middleware.
