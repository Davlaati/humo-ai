import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function baseState() {
  return {
    meta: { initializedForDate: todayIsoDate() },
    users: [],
    payments: [],
    adminLogs: [],
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

  return parsed;
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
  };
}
