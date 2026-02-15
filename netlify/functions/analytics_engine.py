from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional

ISO_FORMATS = (
    "%Y-%m-%dT%H:%M:%S.%fZ",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%d",
)


def parse_ts(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    for fmt in ISO_FORMATS:
        try:
            dt = datetime.strptime(value, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    return None


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def default_dataset() -> Dict[str, List[Dict[str, Any]]]:
    return {
        "users": [
            {"id": "u1", "joinedAt": "2026-01-01", "lastActiveAt": "2026-02-15T08:00:00Z"},
            {"id": "u2", "joinedAt": "2026-01-20", "lastActiveAt": "2026-02-14T11:30:00Z"},
            {"id": "u3", "joinedAt": "2026-02-03", "lastActiveAt": "2026-02-15T07:10:00Z"},
            {"id": "u4", "joinedAt": "2026-02-05", "lastActiveAt": "2026-02-10T09:00:00Z"},
            {"id": "u5", "joinedAt": "2026-02-09", "lastActiveAt": "2026-02-12T18:20:00Z"},
            {"id": "u6", "joinedAt": "2026-02-12", "lastActiveAt": "2026-02-15T06:45:00Z"},
        ],
        "events": [
            {"userId": "u1", "feature": "lesson", "timestamp": "2026-02-15T07:50:00Z"},
            {"userId": "u1", "feature": "dictionary", "timestamp": "2026-02-14T10:10:00Z"},
            {"userId": "u2", "feature": "speaking_club", "timestamp": "2026-02-14T11:20:00Z"},
            {"userId": "u2", "feature": "lesson", "timestamp": "2026-02-11T11:20:00Z"},
            {"userId": "u3", "feature": "game", "timestamp": "2026-02-15T06:55:00Z"},
            {"userId": "u3", "feature": "lesson", "timestamp": "2026-02-13T12:15:00Z"},
            {"userId": "u4", "feature": "dictionary", "timestamp": "2026-02-10T08:45:00Z"},
            {"userId": "u5", "feature": "lesson", "timestamp": "2026-02-12T18:05:00Z"},
            {"userId": "u6", "feature": "speaking_club", "timestamp": "2026-02-15T06:40:00Z"},
            {"userId": "u6", "feature": "lesson", "timestamp": "2026-02-15T06:42:00Z"},
        ],
        "subscriptions": [
            {"userId": "u1", "status": "active", "mrr": 12, "startedAt": "2026-01-05"},
            {"userId": "u2", "status": "active", "mrr": 12, "startedAt": "2026-01-22"},
            {"userId": "u3", "status": "active", "mrr": 8, "startedAt": "2026-02-04"},
            {"userId": "u4", "status": "canceled", "mrr": 12, "startedAt": "2026-01-15", "canceledAt": "2026-02-12"},
        ],
        "abuseFlags": [
            {"userId": "u5", "reason": "spam", "severity": "medium", "status": "open", "createdAt": "2026-02-13T09:00:00Z"},
            {"userId": "u2", "reason": "payment_fraud", "severity": "high", "status": "resolved", "createdAt": "2026-02-09T09:00:00Z"},
        ],
    }


def _active_user_ids(users: Iterable[Dict[str, Any]], events: Iterable[Dict[str, Any]], since: datetime) -> set[str]:
    active_ids = set()
    for user in users:
        ts = parse_ts(user.get("lastActiveAt"))
        if ts and ts >= since and user.get("id"):
            active_ids.add(str(user["id"]))

    for event in events:
        ts = parse_ts(event.get("timestamp"))
        user_id = event.get("userId")
        if ts and ts >= since and user_id:
            active_ids.add(str(user_id))
    return active_ids


def calculate_growth_analytics(dataset: Dict[str, List[Dict[str, Any]]], ref_time: Optional[datetime] = None) -> Dict[str, Any]:
    now = ref_time or now_utc()
    users = dataset.get("users", [])
    events = dataset.get("events", [])
    subscriptions = dataset.get("subscriptions", [])
    abuse_flags = dataset.get("abuseFlags", [])

    dau_ids = _active_user_ids(users, events, now - timedelta(days=1))
    mau_ids = _active_user_ids(users, events, now - timedelta(days=30))

    paying_active = {
        str(s["userId"]) for s in subscriptions
        if s.get("status") == "active" and str(s.get("userId")) in mau_ids
    }

    conversion_rate = (len(paying_active) / len(mau_ids) * 100) if mau_ids else 0

    active_mrr = sum(float(s.get("mrr", 0)) for s in subscriptions if s.get("status") == "active")
    arpu = (active_mrr / len(mau_ids)) if mau_ids else 0

    churned_recent = [
        s for s in subscriptions
        if s.get("status") == "canceled" and (parse_ts(s.get("canceledAt")) or now - timedelta(days=365)) >= now - timedelta(days=30)
    ]

    subs_30d_ago = [
        s for s in subscriptions
        if (parse_ts(s.get("startedAt")) or now) <= now - timedelta(days=30)
    ]
    churn_rate = (len(churned_recent) / len(subs_30d_ago) * 100) if subs_30d_ago else 0

    abuse_open = [f for f in abuse_flags if f.get("status") == "open"]
    abuse_rate = (len(abuse_open) / len(mau_ids) * 100) if mau_ids else 0

    feature_map: Dict[str, Dict[str, Any]] = {}
    for event in events:
        ts = parse_ts(event.get("timestamp"))
        if not ts or ts < now - timedelta(days=30):
            continue
        feature = str(event.get("feature", "unknown"))
        user_id = str(event.get("userId", "unknown"))
        item = feature_map.setdefault(feature, {"feature": feature, "totalEvents": 0, "users": set()})
        item["totalEvents"] += 1
        item["users"].add(user_id)

    feature_usage = [
        {
            "feature": entry["feature"],
            "totalEvents": entry["totalEvents"],
            "uniqueUsers": len(entry["users"]),
            "engagementRate": (len(entry["users"]) / len(mau_ids) * 100) if mau_ids else 0,
        }
        for entry in feature_map.values()
    ]
    feature_usage.sort(key=lambda x: x["totalEvents"], reverse=True)

    return {
        "summary": {
            "dau": len(dau_ids),
            "mau": len(mau_ids),
            "dauMauRatio": (len(dau_ids) / len(mau_ids) * 100) if mau_ids else 0,
            "conversionRate": conversion_rate,
            "activeSubscribers": len(paying_active),
            "mrr": round(active_mrr, 2),
            "arpu": round(arpu, 2),
            "churnRate": round(churn_rate, 2),
            "openAbuseFlags": len(abuse_open),
            "abuseRate": round(abuse_rate, 2),
        },
        "featureUsage": feature_usage,
        "abuseFlags": abuse_flags,
        "generatedAt": now.isoformat(),
    }
