import json


def handler(event, context):
    if event.get("httpMethod") != "GET":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    period = (event.get("queryStringParameters") or {}).get("period", "weekly")
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"period": period, "items": []}),
    }
