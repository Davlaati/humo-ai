import json
from analytics_engine import calculate_growth_analytics, default_dataset


def handler(event, context):
    if event.get("httpMethod") != "GET":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    analytics = calculate_growth_analytics(default_dataset())
    payload = {
        "featureUsage": analytics["featureUsage"],
        "abuseFlags": analytics["abuseFlags"],
        "generatedAt": analytics["generatedAt"],
    }
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }
