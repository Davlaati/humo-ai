import {
  EntryNotification,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardUserRecord,
  PremiumPlanType,
  PremiumSubscription,
  StarsTransaction,
  Transaction,
  UserProfile,
} from '../types';

const USER_KEY = 'humo_user';
const TRANSACTIONS_KEY = 'humo_transactions';
const NOTIFICATION_KEY = 'humo_entry_notification';
const LEADERBOARD_KEY = 'humo_leaderboard_users';
const SUBSCRIPTIONS_KEY = 'humo_premium_subscriptions';
const SETTINGS_KEY = 'humo_app_settings';
const CONVERSION_RATE = 10;

const PLAN_PRICES: Record<PremiumPlanType, number> = {
  '7d': 15000,
  '1m': 55000,
  '1y': 550000,
};

const PLAN_DURATION_DAYS: Record<PremiumPlanType, number> = {
  '7d': 7,
  '1m': 30,
  '1y': 365,
};

const getWeekKey = (date = new Date()): string => {
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - yearStart.getTime()) / 86400000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${date.getFullYear()}-W${week}`;
};

const getMonthKey = (date = new Date()): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getLeaderboardStore = (): LeaderboardUserRecord[] => safeParse(localStorage.getItem(LEADERBOARD_KEY), []);
const saveLeaderboardStore = (data: LeaderboardUserRecord[]) => localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));

const getSubscriptionsStore = (): PremiumSubscription[] => safeParse(localStorage.getItem(SUBSCRIPTIONS_KEY), []);
const saveSubscriptionsStore = (data: PremiumSubscription[]) => localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(data));

const getSettingsStore = (): Record<string, string> => safeParse(localStorage.getItem(SETTINGS_KEY), {});
const saveSettingsStore = (settings: Record<string, string>) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

const syncLeaderboardUser = (user: UserProfile) => {
  const records = getLeaderboardStore();
  const now = new Date();
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);

  const existing = records.find((item) => item.id === user.id);
  if (!existing) {
    records.push({
      id: user.id,
      telegramId: user.id,
      username: user.username,
      points_total: user.xp || 0,
      points_weekly: user.xp || 0,
      points_monthly: user.xp || 0,
      created_at: user.joinedAt || now.toISOString(),
      weekKey,
      monthKey,
    });
    saveLeaderboardStore(records);
    return;
  }

  existing.username = user.username;
  if (existing.weekKey !== weekKey) {
    existing.points_weekly = 0;
    existing.weekKey = weekKey;
  }
  if (existing.monthKey !== monthKey) {
    existing.points_monthly = 0;
    existing.monthKey = monthKey;
  }

  saveLeaderboardStore(records);
};

export const getUser = (): UserProfile | null => {
  try {
    const user = safeParse<any>(localStorage.getItem(USER_KEY), null);
    if (!user) return null;

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user;
      user.name = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
      user.username = tgUser.username || user.username;
      user.avatarUrl = tgUser.photo_url || user.avatarUrl;
    }

    if (!user.settings) user.settings = { language: 'Uz', theme: 'dark' };
    if (user.telegramStars === undefined) user.telegramStars = 0;
    if (user.isPremium === undefined) user.isPremium = false;
    if (!user.starsHistory) user.starsHistory = [];
    if (user.xp === undefined) user.xp = 0;
    if (user.coins === undefined) user.coins = 0;
    if (user.streak === undefined) user.streak = 0;

    const activeSubscription = getActiveSubscription(user.id);
    user.isPremium = Boolean(activeSubscription);
    (user as any).premiumExpiresAt = activeSubscription?.expiresAt;

    syncLeaderboardUser(user as UserProfile);
    return user as UserProfile;
  } catch {
    return null;
  }
};

export const saveUser = (user: UserProfile) => {
  const data = { ...user };
  if (!data.settings) data.settings = { language: 'Uz', theme: 'dark' };
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  syncLeaderboardUser(data);
};

export const addLeaderboardPoints = (user: UserProfile, points: number) => {
  if (points <= 0) return;
  const records = getLeaderboardStore();
  const now = new Date();
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);

  let record = records.find((item) => item.id === user.id);
  if (!record) {
    record = {
      id: user.id,
      telegramId: user.id,
      username: user.username,
      points_total: 0,
      points_weekly: 0,
      points_monthly: 0,
      created_at: user.joinedAt || now.toISOString(),
      weekKey,
      monthKey,
    };
    records.push(record);
  }

  if (record.weekKey !== weekKey) {
    record.points_weekly = 0;
    record.weekKey = weekKey;
  }
  if (record.monthKey !== monthKey) {
    record.points_monthly = 0;
    record.monthKey = monthKey;
  }

  record.points_total += points;
  record.points_weekly += points;
  record.points_monthly += points;
  saveLeaderboardStore(records);
};

export const getLeaderboardData = async (period: LeaderboardPeriod, currentUser: UserProfile): Promise<LeaderboardEntry[]> => {
  const records = getLeaderboardStore();
  const now = new Date();
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);

  const mapped = records.map((item) => {
    const points =
      period === 'weekly'
        ? item.weekKey === weekKey
          ? item.points_weekly
          : 0
        : period === 'monthly'
          ? item.monthKey === monthKey
            ? item.points_monthly
            : 0
          : item.points_total;

    return {
      userId: item.id,
      name: item.username || `User ${item.id.slice(-4)}`,
      xp: points,
      wins: Math.floor(points / 100),
      rank: 0,
      isCurrentUser: item.id === currentUser.id,
      trend: 'same' as const,
    };
  });

  mapped.sort((a, b) => b.xp - a.xp);

  return mapped
    .filter((entry) => entry.xp > 0 || entry.isCurrentUser)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
};

export const getLeaderboardTop100 = (period: LeaderboardPeriod = 'weekly') => {
  const currentUser = getUser();
  if (!currentUser) return [];
  return getLeaderboardData(period, currentUser).then((data) => data.slice(0, 100));
};

export const resetWeeklyLeaderboard = () => {
  const records = getLeaderboardStore();
  const weekKey = getWeekKey();
  records.forEach((item) => {
    item.points_weekly = 0;
    item.weekKey = weekKey;
  });
  saveLeaderboardStore(records);
};

export const submitPremiumRequest = (user: UserProfile, planType: PremiumPlanType, proofImage: string) => {
  const subs = getSubscriptionsStore();
  const record: PremiumSubscription = {
    id: `sub_${Date.now()}`,
    userId: user.id,
    planType,
    price: PLAN_PRICES[planType],
    status: 'pending',
    proofImage,
    createdAt: new Date().toISOString(),
  };
  subs.unshift(record);
  saveSubscriptionsStore(subs);
  return record;
};

export const getPremiumRequests = () => getSubscriptionsStore();

export const getActiveSubscription = (userId: string): PremiumSubscription | null => {
  const now = Date.now();
  return (
    getSubscriptionsStore().find(
      (item) => item.userId === userId && item.status === 'approved' && item.expiresAt && new Date(item.expiresAt).getTime() > now,
    ) || null
  );
};

export const reviewPremiumRequest = (subscriptionId: string, status: 'approved' | 'rejected') => {
  const subs = getSubscriptionsStore();
  const target = subs.find((item) => item.id === subscriptionId);
  if (!target) return null;

  target.status = status;
  if (status === 'approved') {
    const expires = new Date();
    expires.setDate(expires.getDate() + PLAN_DURATION_DAYS[target.planType]);
    target.expiresAt = expires.toISOString();
  }

  saveSubscriptionsStore(subs);
  return target;
};

export const getAppSetting = (key: string): string | null => {
  const settings = getSettingsStore();
  return settings[key] || null;
};

export const setAppSetting = (key: string, value: string) => {
  const settings = getSettingsStore();
  settings[key] = value;
  saveSettingsStore(settings);
};

export const convertHumoToStars = (starsAmount: number): UserProfile | null => {
  const user = getUser();
  if (!user) return null;

  const humoCost = starsAmount * CONVERSION_RATE;
  if (user.coins < humoCost) return null;

  const transaction: StarsTransaction = {
    id: `tx_${Date.now()}`,
    type: 'conversion',
    amount: starsAmount,
    costInHumo: humoCost,
    status: 'completed',
    timestamp: new Date().toISOString(),
  };

  user.coins -= humoCost;
  user.telegramStars += starsAmount;
  user.starsHistory.unshift(transaction);

  saveUser(user);
  return user;
};

export const adminUpdateBalance = (_stars: number, coins: number): UserProfile | null => {
  const user = getUser();
  if (!user) return null;

  user.coins += coins;
  if (user.coins < 0) user.coins = 0;

  saveUser(user);
  return user;
};

export const getEntryNotification = (): EntryNotification | null => {
  const data = safeParse<EntryNotification | null>(localStorage.getItem(NOTIFICATION_KEY), null);
  if (data) return data;

  return {
    id: 'welcome_v1',
    title: 'Xush kelibsiz!',
    description: "Sizni yana Humo AI ilovasida ko'rganimizdan mamnunmiz. Keling, bugun bilimlarimizni yanada oshiramiz!",
    buttonText: 'Darsni boshlash',
    target: 'all',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
};

export const saveEntryNotification = (notif: EntryNotification) => {
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notif));
};

export const getTransactions = (): Transaction[] => safeParse(localStorage.getItem(TRANSACTIONS_KEY), []);

export const addTransaction = (transaction: Transaction) => {
  const txs = getTransactions();
  txs.push(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
};

export const incrementActiveTime = (seconds: number): UserProfile | null => {
  const user = getUser();
  if (!user) return null;
  user.activeSecondsToday = (user.activeSecondsToday || 0) + seconds;
  saveUser(user);
  return user;
};
