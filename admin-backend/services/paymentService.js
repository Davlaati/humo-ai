import { addAdminLog, createPayment, findPaymentById, findPaymentByTelegramPaymentId, getOrCreateUser, getStats, listAdminLogs, listPayments, listUsers, markPaymentFailed, markPaymentPaid } from '../data/store.js';
import { env } from '../config/env.js';

const TELEGRAM_API = 'https://api.telegram.org';
const PACKAGE_MAP = {
  s50: 50,
  s100: 100,
  s250: 250,
  s500: 500,
};

async function tgCall(method, body, retries = 2) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(`${TELEGRAM_API}/bot${env.telegramBotToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.description || `Telegram API ${method} failed`);
      return json.result;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`Telegram API ${method} failed`);
}

export function listPackages() {
  return PACKAGE_MAP;
}

export async function createInvoice({ telegramId, username, packKey }) {
  const starsAmount = PACKAGE_MAP[packKey];
  if (!starsAmount) throw new Error('Invalid package');

  const user = getOrCreateUser(telegramId, username || '');
  const payment = createPayment({
    userId: user.id,
    amount: starsAmount,
    currency: 'XTR',
    status: 'pending',
    mode: env.paymentMode,
  });

  if (env.paymentMode === 'demo') {
    return {
      mode: 'demo',
      paymentId: payment.id,
      starsAmount,
      simulateEndpoint: '/api/payments/simulate-success',
    };
  }

  const payload = `stars_payment:${payment.id}:${user.telegram_id}`;

  const invoiceLink = await tgCall('createInvoiceLink', {
    title: 'Stars Purchase',
    description: `Buy ${starsAmount} Telegram Stars in HUMO AI`,
    payload,
    currency: 'XTR',
    prices: [{ label: 'Stars Purchase', amount: starsAmount }],
  });

  return {
    mode: 'real',
    paymentId: payment.id,
    invoiceLink,
    starsAmount,
  };
}

export function simulateSuccess({ paymentId, telegramPaymentId = null }) {
  const updated = markPaymentPaid({ paymentId, telegramPaymentId: telegramPaymentId || `demo_${paymentId}` });
  if (!updated) throw new Error('Payment not found');
  return updated;
}

export function manualVerifyPayment(paymentId, adminId) {
  const updated = markPaymentPaid({ paymentId, telegramPaymentId: `manual_${paymentId}` });
  if (!updated) throw new Error('Payment not found');
  addAdminLog({ adminId, action: 'manual_verify_payment', targetId: paymentId });
  return updated;
}

export async function handleTelegramWebhook(update) {
  if (update.pre_checkout_query) {
    await tgCall('answerPreCheckoutQuery', {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true,
    });
    return { type: 'pre_checkout_query', status: 'answered' };
  }


  const text = update.message?.text || '';
  if (text.startsWith('/buy_stars')) {
    const chatId = update.message.chat?.id;
    if (chatId) {
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: 'Open HUMO AI Mini App and tap Buy Stars package to complete payment.',
      });
    }
    return { type: 'command', status: 'buy_stars_sent' };
  }

  const successfulPayment = update.message?.successful_payment;
  if (successfulPayment) {
    const payload = successfulPayment.invoice_payload || '';
    const [prefix, paymentIdRaw] = payload.split(':');
    if (prefix !== 'stars_payment') {
      return { type: 'successful_payment', status: 'ignored_payload' };
    }

    const paymentId = Number(paymentIdRaw);
    const duplicated = findPaymentByTelegramPaymentId(successfulPayment.telegram_payment_charge_id);
    if (duplicated) {
      return { type: 'successful_payment', status: 'duplicate_ignored', paymentId: duplicated.id };
    }

    const payment = findPaymentById(paymentId);
    if (!payment) {
      return { type: 'successful_payment', status: 'payment_not_found' };
    }

    markPaymentPaid({
      paymentId,
      telegramPaymentId: successfulPayment.telegram_payment_charge_id,
    });

    return { type: 'successful_payment', status: 'paid', paymentId };
  }

  if (update.message?.invoice) {
    return { type: 'invoice', status: 'pending' };
  }

  return { type: 'unknown', status: 'ignored' };
}

export function getAdminData() {
  return {
    users: listUsers(),
    payments: listPayments(),
    stats: getStats(),
    logs: listAdminLogs(),
  };
}

export function getUserBalance(telegramId) {
  const user = getOrCreateUser(telegramId);
  return { telegramId: user.telegram_id, balanceStars: user.balance_stars };
}

export function failPayment(paymentId) {
  return markPaymentFailed(paymentId);
}
