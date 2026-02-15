import json
from datetime import datetime, timedelta, timezone


def handler(event, context):
    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    body = json.loads(event.get("body") or "{}")
    days = {"7d": 7, "1m": 30, "1y": 365}.get(body.get("plan_type"), 30)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat() if body.get("action") == "approved" else None

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "id": body.get("id"),
            "status": body.get("action"),
            "expires_at": expires_at,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        })
    }
