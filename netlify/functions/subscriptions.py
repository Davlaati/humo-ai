import json
from datetime import datetime, timedelta, timezone

SUBSCRIPTIONS = []


def _expires(plan_type: str) -> str:
    days = {"7d": 7, "1m": 30, "1y": 365}.get(plan_type, 30)
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def handler(event, context):
    method = event.get("httpMethod")
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        item = {
            "id": f"sub_{int(datetime.now().timestamp())}",
            "user_id": body.get("user_id"),
            "plan_type": body.get("plan_type"),
            "price": body.get("price"),
            "status": "pending",
            "proof_image": body.get("proof_image"),
            "expires_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        SUBSCRIPTIONS.append(item)
        return {"statusCode": 200, "body": json.dumps(item), "headers": {"Content-Type": "application/json"}}

    if method == "GET":
        return {"statusCode": 200, "body": json.dumps({"items": SUBSCRIPTIONS}), "headers": {"Content-Type": "application/json"}}

    return {"statusCode": 405, "body": "Method Not Allowed"}
