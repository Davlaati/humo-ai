const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function completeLesson(telegramId: string, points: number) {
  const res = await fetch(`${API_BASE}/api/public/lesson/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramId, points }),
  });
  return res.json();
}

export async function fetchLeaderboard(period: 'weekly' | 'monthly' | 'alltime', telegramId?: string, limit: number = 100) {
  const qs = new URLSearchParams({ period, limit: String(limit) });
  if (telegramId) qs.set('telegramId', telegramId);
  const res = await fetch(`${API_BASE}/api/public/leaderboard?${qs.toString()}`);
  return res.json();
}

export async function createSubscription(payload: { telegramId: string; username?: string; planType: '7d' | '1m' | '1y'; proofImage: string }) {
  const res = await fetch(`${API_BASE}/api/public/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchCurrentUser(telegramId: string) {
  const res = await fetch(`${API_BASE}/api/public/users/me?telegramId=${encodeURIComponent(telegramId)}`);
  return res.json();
}

export async function fetchLoadingLogo() {
  const res = await fetch(`${API_BASE}/api/public/settings/loading-logo`);
  return res.json();
}
