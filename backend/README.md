# HUMO AI Backend (FastAPI)

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Set env vars in `.env`:

- `DATABASE_URL`
- `SECRET_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBAPP_BOT_TOKEN`
- `GEMINI_API_KEY`

