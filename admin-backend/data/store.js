import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

function nowIso() {
  return new Date().toISOString();
}

function todayIsoDate() {
  return nowIso().slice(0, 10);
}

function monthKey() {
  return nowIso().slice(0, 7);
}

function baseState() {
  return {
    meta: {
      initializedForDate: todayIsoDate(),
      initializedForMonth: monthKey(),
      sequence: { users: 0, payments: 0, adminLogs: 0, subscriptions: 0, settings: 0 },
    },
    users: [],
    payments: [],
    subscriptions: [],
    appSettings: [],
    adminLogs: [],
  };
}

function save(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function ensureCounters(state) {
  state.meta.sequence = state.meta.sequence || { users: 0, payments: 0, adminLogs: 0, subscriptions: 0, settings: 0 };
}

function resetDailyIfNeeded(state) {
  if (state.meta.initializedForDate === todayIsoDate()) return;

  state.users = state.users.map((user) => ({ ...user, balance_stars: 0, points_weekly: 0 }));
  state.payments = [];
  state.subscriptions = [];
  state.adminLogs = [];
  state.meta.initializedForDate = todayIsoDate();
  save(state);
}

function resetMonthlyIfNeeded(state) {
  if (state.meta.initializedForMonth === monthKey()) return;
  state.users = state.users.map((user) => ({ ...user, points_monthly: 0 }));
  state.meta.initializedForMonth = monthKey();
  save(state);
}

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = baseState();
    save(initial);
    return initial;
  }

  const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  ensureCounters(parsed);
  resetDailyIfNeeded(parsed);
  resetMonthlyIfNeeded(parsed);
  return parsed;
}

const state = load();

function nextId(scope) {
  state.meta.sequence[scope] = (state.meta.sequence[scope] || 0) + 1;
  return state.meta.sequence[scope];
}

export function getOrCreateUser(telegramId, username = '') {
  const id = String(telegramId);
  let user = state.users.find((item) => item.telegram_id === id);
  if (!user) {
    user = {
      id: nextId('users'),
      telegram_id: id,
      username,
      balance_stars: 0,
      points_total: 0,
      points_weekly: 0,
      points_monthly: 0,
      is_premium: false,
      premium_until: null,
      created_at: nowIso(),
    };
    state.users.push(user);
    save(state);
  }
  return user;
}

export function addUserPoints(telegramId, points) {
  const user = getOrCreateUser(telegramId);
  const safePoints = Math.max(0, Number(points || 0));
  user.points_total += safePoints;
  user.points_weekly += safePoints;
  user.points_monthly += safePoints;
  save(state);
  return user;
}

export function getLeaderboard(period = 'alltime', limit = 100, currentTelegramId = null) {
  const key = period === 'weekly' ? 'points_weekly' : period === 'monthly' ? 'points_monthly' : 'points_total';
  const rows = [...state.users]
    .sort((a, b) => b[key] - a[key])
    .slice(0, Math.min(100, Math.max(1, Number(limit) || 100)))
    .map((user, index) => ({
      userId: String(user.id),
      telegramId: user.telegram_id,
      name: user.username || `User ${user.telegram_id.slice(-4)}`,
      xp: user[key],
      wins: Math.floor((user[key] || 0) / 120),
      rank: index + 1,
      isCurrentUser: currentTelegramId ? user.telegram_id === String(currentTelegramId) : false,
      trend: 'same',
    }));

  return rows;
}

export function resetWeeklyLeaderboard() {
  state.users = state.users.map((user) => ({ ...user, points_weekly: 0 }));
  save(state);
}

export function createPayment({ userId, amount, currency, status = 'pending', mode = 'demo', telegramPaymentId = null }) {
  const payment = {
    id: nextId('payments'),
    user_id: userId,
    amount,
    currency,
    status,
    mode,
    telegram_payment_id: telegramPaymentId,
    retries: 0,
    created_at: nowIso(),
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

export function createSubscription({ userTelegramId, username, planType, price, proofImage }) {
  const user = getOrCreateUser(userTelegramId, username || '');
  const subscription = {
    id: nextId('subscriptions'),
    user_id: user.id,
    plan_type: planType,
    price,
    status: 'pending',
    proof_image: proofImage,
    expires_at: null,
    created_at: nowIso(),
  };
  state.subscriptions.push(subscription);
  save(state);
  return subscription;
}

export function listSubscriptions(status = null) {
  const rows = status ? state.subscriptions.filter((item) => item.status === status) : state.subscriptions;
  return [...rows].sort((a, b) => b.id - a.id);
}

export function reviewSubscription({ subscriptionId, status }) {
  const subscription = state.subscriptions.find((item) => item.id === Number(subscriptionId));
  if (!subscription) return null;

  subscription.status = status;
  if (status === 'approved') {
    const user = state.users.find((item) => item.id === subscription.user_id);
    if (user) {
      const base = new Date();
      if (user.premium_until) {
        const current = new Date(user.premium_until);
        if (!Number.isNaN(current.getTime()) && current > base) {
          base.setTime(current.getTime());
        }
      }

      if (subscription.plan_type === '7d') base.setDate(base.getDate() + 7);
      if (subscription.plan_type === '1m') base.setMonth(base.getMonth() + 1);
      if (subscription.plan_type === '1y') base.setFullYear(base.getFullYear() + 1);

      subscription.expires_at = base.toISOString();
      user.is_premium = true;
      user.premium_until = subscription.expires_at;
    }
  }

  if (status === 'rejected') {
    subscription.expires_at = null;
  }

  save(state);
  return subscription;
}

export function upsertSetting(key, value) {
  let row = state.appSettings.find((item) => item.key === key);
  if (!row) {
    row = { id: nextId('settings'), key, value, updated_at: nowIso() };
    state.appSettings.push(row);
  } else {
    row.value = value;
    row.updated_at = nowIso();
  }
  save(state);
  return row;
}

export function getSetting(key) {
  return state.appSettings.find((item) => item.key === key) || null;
}

export function listUsers() {
  return state.users;
}

export function listPayments() {
  return [...state.payments].sort((a, b) => b.id - a.id);
}

export function addAdminLog({ adminId, action, targetId }) {
  const log = {
    id: nextId('adminLogs'),
    admin_id: adminId,
    action,
    target_id: targetId,
    created_at: nowIso(),
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
    pendingSubscriptions: state.subscriptions.filter((item) => item.status === 'pending').length,
  };
}
