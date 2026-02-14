import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const todayIsoDate = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);
const weekKey = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  return `${now.getFullYear()}-W${Math.ceil(days / 7)}`;
};

function baseState() {
  return {
    meta: { initializedForDate: todayIsoDate(), weekKey: weekKey(), monthKey: monthKey() },
    users: [],
    payments: [],
    subscriptions: [],
    adminLogs: [],
    appSettings: {},
  };
}

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = baseState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }

  const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (parsed?.meta?.initializedForDate !== todayIsoDate()) {
    const reset = baseState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(reset, null, 2));
    return reset;
  }

  return {
    ...baseState(),
    ...parsed,
    appSettings: parsed.appSettings || {},
    subscriptions: parsed.subscriptions || [],
  };
}

function save(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

const state = load();

export function getOrCreateUser(telegramId, username = '') {
  const id = String(telegramId);
  let user = state.users.find((item) => item.telegram_id === id);
  if (!user) {
    user = {
      id: state.users.length + 1,
      telegram_id: id,
      username,
      balance_stars: 0,
      points_total: 0,
      points_weekly: 0,
      points_monthly: 0,
      is_premium: false,
      premium_expires_at: null,
      created_at: new Date().toISOString(),
    };
    state.users.push(user);
    save(state);
  }
  return user;
}

export function getUserByTelegramId(telegramId) {
  return state.users.find((item) => item.telegram_id === String(telegramId)) || null;
}

export function addLessonPoints(telegramId, username, points) {
  const user = getOrCreateUser(telegramId, username);

  if (state.meta.weekKey !== weekKey()) {
    state.meta.weekKey = weekKey();
    state.users.forEach((item) => { item.points_weekly = 0; });
  }
  if (state.meta.monthKey !== monthKey()) {
    state.meta.monthKey = monthKey();
    state.users.forEach((item) => { item.points_monthly = 0; });
  }

  user.points_total += points;
  user.points_weekly += points;
  user.points_monthly += points;
  save(state);
  return user;
}

export function listLeaderboard(period = 'weekly', limit = 100) {
  const key = period === 'monthly' ? 'points_monthly' : period === 'alltime' ? 'points_total' : 'points_weekly';
  return [...state.users]
    .sort((a, b) => b[key] - a[key])
    .slice(0, limit)
    .map((item, idx) => ({ ...item, rank: idx + 1, points: item[key] }));
}

export function resetWeeklyLeaderboard() {
  state.meta.weekKey = weekKey();
  state.users.forEach((item) => { item.points_weekly = 0; });
  save(state);
}

export function createSubscription({ userId, planType, price, proofImage }) {
  const record = {
    id: state.subscriptions.length + 1,
    user_id: userId,
    plan_type: planType,
    price,
    status: 'pending',
    proof_image: proofImage,
    expires_at: null,
    created_at: new Date().toISOString(),
  };
  state.subscriptions.unshift(record);
  save(state);
  return record;
}

export function listSubscriptions(status = null) {
  return status ? state.subscriptions.filter((item) => item.status === status) : state.subscriptions;
}

export function reviewSubscription(subscriptionId, status) {
  const sub = state.subscriptions.find((item) => item.id === Number(subscriptionId));
  if (!sub) return null;

  sub.status = status;
  if (status === 'approved') {
    const days = sub.plan_type === '7d' ? 7 : sub.plan_type === '1m' ? 30 : 365;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    sub.expires_at = expires.toISOString();

    const user = state.users.find((item) => item.id === sub.user_id);
    if (user) {
      user.is_premium = true;
      user.premium_expires_at = sub.expires_at;
    }
  }

  save(state);
  return sub;
}

export function setAppSetting(key, value) {
  state.appSettings[key] = value;
  save(state);
}

export function getAppSetting(key) {
  return state.appSettings[key] || null;
}

export function createPayment({ userId, amount, currency, status = 'pending', mode = 'demo', telegramPaymentId = null }) {
  const payment = {
    id: state.payments.length + 1,
    user_id: userId,
    amount,
    currency,
    status,
    mode,
    telegram_payment_id: telegramPaymentId,
    retries: 0,
    created_at: new Date().toISOString(),
  };
  state.payments.push(payment);
  save(state);
  return payment;
}

export function markPaymentPaid({ paymentId, telegramPaymentId }) {
  const payment = state.payments.find((item) => item.id === Number(paymentId));
  if (!payment) return null;
  if (payment.status === 'paid') return payment;

  payment.status = 'paid';
  payment.telegram_payment_id = telegramPaymentId || payment.telegram_payment_id;

  const user = state.users.find((item) => item.id === payment.user_id);
  if (user) user.balance_stars += payment.amount;

  save(state);
  return payment;
}

export function markPaymentFailed(paymentId) {
  const payment = state.payments.find((item) => item.id === Number(paymentId));
  if (!payment) return null;
  payment.status = 'failed';
  save(state);
  return payment;
}

export function findPaymentById(paymentId) {
  return state.payments.find((item) => item.id === Number(paymentId)) || null;
}

export function findPaymentByTelegramPaymentId(telegramPaymentId) {
  return state.payments.find((item) => item.telegram_payment_id === telegramPaymentId) || null;
}

export function listUsers() {
  return state.users;
}

export function listPayments() {
  return [...state.payments].sort((a, b) => b.id - a.id);
}

export function addAdminLog({ adminId, action, targetId }) {
  const log = {
    id: state.adminLogs.length + 1,
    admin_id: adminId,
    action,
    target_id: targetId,
    created_at: new Date().toISOString(),
  };
  state.adminLogs.push(log);
  save(state);
  return log;
}

export function listAdminLogs() {
  return [...state.adminLogs].sort((a, b) => b.id - a.id);
}

export function getStats() {
  return {
    usersCount: state.users.length,
    paymentsCount: state.payments.length,
    paidPaymentsCount: state.payments.filter((item) => item.status === 'paid').length,
    totalStarsSold: state.payments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0),
    premiumPending: state.subscriptions.filter((item) => item.status === 'pending').length,
  };
}
