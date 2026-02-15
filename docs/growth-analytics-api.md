# Growth Analytics Backend Endpoints

## Endpoints

### `GET /.netlify/functions/analytics-overview`
Returns top-level growth KPIs:
- DAU / MAU and stickiness
- conversion rate
- active subscribers
- MRR + ARPU
- churn rate
- abuse flag counts

### `GET /.netlify/functions/analytics-feature-usage`
Returns detailed tables:
- feature usage stats (`totalEvents`, `uniqueUsers`, `engagementRate`)
- abuse flag list for trust-and-safety workflow

## Calculation Logic
All KPI calculations are centralized in:
- `netlify/functions/analytics_engine.py`

The engine computes:
- `dau`, `mau`, `dauMauRatio`
- `conversionRate`
- `mrr`, `arpu`
- `churnRate`
- `openAbuseFlags`, `abuseRate`
- per-feature usage rows

> The endpoints currently use a seeded demo dataset (`default_dataset`) so the admin UI can render immediately. You can replace this with production DB reads while keeping the same response contract.
