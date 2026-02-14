import { addAdminLog, addUserPoints, createSubscription, getLeaderboard, getSetting, listSubscriptions, resetWeeklyLeaderboard, reviewSubscription, upsertSetting } from '../data/store.js';

const PLAN_PRICES = {
  '7d': 15000,
  '1m': 55000,
  '1y': 550000,
};

export function addLessonPoints({ telegramId, points }) {
  return addUserPoints(telegramId, points);
}

export function getLeaderboardData({ period, limit, currentTelegramId }) {
  return getLeaderboard(period, limit, currentTelegramId);
}

export function createSubscriptionRequest({ telegramId, username, planType, proofImage }) {
  const price = PLAN_PRICES[planType];
  if (!price) throw new Error('Invalid plan type');
  if (!proofImage) throw new Error('Proof image is required');
  return createSubscription({ userTelegramId: telegramId, username, planType, price, proofImage });
}

export function listPendingSubscriptions() {
  return listSubscriptions('pending');
}

export function approveSubscription({ subscriptionId, adminId }) {
  const sub = reviewSubscription({ subscriptionId, status: 'approved' });
  if (!sub) throw new Error('Subscription not found');
  addAdminLog({ adminId, action: 'subscription_approved', targetId: subscriptionId });
  return sub;
}

export function rejectSubscription({ subscriptionId, adminId }) {
  const sub = reviewSubscription({ subscriptionId, status: 'rejected' });
  if (!sub) throw new Error('Subscription not found');
  addAdminLog({ adminId, action: 'subscription_rejected', targetId: subscriptionId });
  return sub;
}

export function resetWeeklyLeaderboardByAdmin({ adminId }) {
  resetWeeklyLeaderboard();
  addAdminLog({ adminId, action: 'leaderboard_weekly_reset', targetId: null });
}

export function setLoadingLogo({ imageUrl, adminId }) {
  const row = upsertSetting('loading_logo', imageUrl);
  addAdminLog({ adminId, action: 'set_loading_logo', targetId: row.id });
  return row;
}

export function getLoadingLogo() {
  return getSetting('loading_logo');
}
