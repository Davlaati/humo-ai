import { EntryNotification, LeaderboardEntry, LeaderboardPeriod, SubscriptionRequest, Transaction, UserProfile } from "../types";

const USER_KEY = 'humo_user';
const USERS_DB_KEY = 'humo_users_db';
const SUBSCRIPTIONS_KEY = 'humo_subscriptions';
const TRANSACTIONS_KEY = 'humo_transactions';
const NOTIFICATION_KEY = 'humo_entry_notification';
const APP_SETTINGS_KEY = 'humo_app_settings';

const PLAN_DAYS = { '7d': 7, '1m': 30, '1y': 365 } as const;

const normalizeUser = (raw: UserProfile): UserProfile => {
  const user = { ...raw };
  if (!user.settings) user.settings = { language: 'Uz', theme: 'dark' };
  if (user.telegramStars === undefined) user.telegramStars = 0;
  if (!user.starsHistory) user.starsHistory = [];
  if (user.xp === undefined) user.xp = 0;
  if (user.coins === undefined) user.coins = 0;
  if (user.streak === undefined) user.streak = 0;
  if (user.pointsTotal === undefined) user.pointsTotal = 0;
  if (user.pointsWeekly === undefined) user.pointsWeekly = 0;
  if (user.pointsMonthly === undefined) user.pointsMonthly = 0;
  if (user.isPremium === undefined) user.isPremium = false;

  if (user.premiumExpiresAt && new Date(user.premiumExpiresAt).getTime() < Date.now()) {
    user.isPremium = false;
  }

  return user;
};

const getUsersDb = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    const users = raw ? JSON.parse(raw) : [];
    return Array.isArray(users) ? users.map(normalizeUser) : [];
  } catch {
    return [];
  }
};

const saveUsersDb = (users: UserProfile[]) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

const upsertUserInDb = (user: UserProfile) => {
  const users = getUsersDb();
  const idx = users.findIndex(u => u.id === user.id);
  const normalized = normalizeUser(user);
  if (idx >= 0) users[idx] = normalized;
  else users.push(normalized);
  saveUsersDb(users);
};

const scoreByPeriod = (u: UserProfile, period: LeaderboardPeriod) => {
  if (period === 'weekly') return u.pointsWeekly || 0;
  if (period === 'monthly') return u.pointsMonthly || 0;
  return u.pointsTotal || 0;
};

export const getUser = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (!data || data === "undefined" || data === "null") return null;
    const user = normalizeUser(JSON.parse(data));

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user;
      user.name = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
      user.username = tgUser.username || user.username;
      user.avatarUrl = tgUser.photo_url || user.avatarUrl;
      user.telegramId = String(tgUser.id || user.telegramId || '');
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    upsertUserInDb(user);
    return user;
  } catch {
    return null;
  }
};

export const saveUser = (user: UserProfile) => {
  const normalized = normalizeUser(user);
  localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  upsertUserInDb(normalized);
};

export const addLessonPoints = (user: UserProfile, points: number): UserProfile => {
  const updated: UserProfile = {
    ...user,
    pointsTotal: (user.pointsTotal || 0) + points,
    pointsWeekly: (user.pointsWeekly || 0) + points,
    pointsMonthly: (user.pointsMonthly || 0) + points,
  };
  saveUser(updated);
  return updated;
};

export const getLeaderboardData = async (period: LeaderboardPeriod, currentUser: UserProfile): Promise<LeaderboardEntry[]> => {
  const users = getUsersDb();
  if (!users.find(u => u.id === currentUser.id)) {
    upsertUserInDb(currentUser);
  }

  const sorted = getUsersDb()
    .sort((a, b) => scoreByPeriod(b, period) - scoreByPeriod(a, period))
    .map((u, idx) => ({
      userId: u.id,
      name: u.name,
      xp: scoreByPeriod(u, period),
      wins: u.wins || 0,
      rank: idx + 1,
      isCurrentUser: u.id === currentUser.id,
      trend: 'same' as const,
    }));

  return sorted;
};

export const getTopUsers = (period: LeaderboardPeriod, limit = 100): UserProfile[] => {
  return getUsersDb()
    .sort((a, b) => scoreByPeriod(b, period) - scoreByPeriod(a, period))
    .slice(0, limit);
};

export const resetWeeklyLeaderboard = () => {
  const users = getUsersDb().map(u => ({ ...u, pointsWeekly: 0 }));
  saveUsersDb(users);
};

export const resetMonthlyLeaderboard = () => {
  const users = getUsersDb().map(u => ({ ...u, pointsMonthly: 0 }));
  saveUsersDb(users);
};

export const getSubscriptions = (): SubscriptionRequest[] => {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const createSubscriptionRequest = (payload: Omit<SubscriptionRequest, 'id' | 'status' | 'createdAt'>): SubscriptionRequest => {
  const item: SubscriptionRequest = {
    ...payload,
    id: `sub_${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const all = getSubscriptions();
  all.unshift(item);
  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(all));
  return item;
};

export const reviewSubscriptionRequest = (id: string, action: 'approved' | 'rejected'): SubscriptionRequest | null => {
  const all = getSubscriptions();
  const idx = all.findIndex(x => x.id === id);
  if (idx < 0) return null;

  const item = { ...all[idx], status: action, reviewedAt: new Date().toISOString() as string } as SubscriptionRequest;

  if (action === 'approved') {
    const user = getUsersDb().find(u => u.id === item.userId);
    if (user) {
      const days = PLAN_DAYS[item.planType];
      const baseDate = user.premiumExpiresAt && new Date(user.premiumExpiresAt).getTime() > Date.now()
        ? new Date(user.premiumExpiresAt)
        : new Date();
      baseDate.setDate(baseDate.getDate() + days);
      user.isPremium = true;
      user.premiumExpiresAt = baseDate.toISOString();
      item.expiresAt = user.premiumExpiresAt;
      saveUser(user);
    }
  }

  if (action === 'rejected') {
    const user = getUsersDb().find(u => u.id === item.userId);
    if (user) {
      saveUser({ ...user, isPremium: user.premiumExpiresAt ? new Date(user.premiumExpiresAt).getTime() > Date.now() : false });
    }
  }

  all[idx] = item;
  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(all));
  return item;
};

export const getEntryNotification = (): EntryNotification | null => {
  try {
    const data = localStorage.getItem(NOTIFICATION_KEY);
    if (!data) return {
      id: 'welcome_v1',
      title: 'Xush kelibsiz!',
      description: 'Sizni yana Humo AI ilovasida ko\'rganimizdan mamnunmiz. Keling, bugun bilimlarimizni yanada oshiramiz!',
      buttonText: 'Darsni boshlash',
      target: 'all',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const saveEntryNotification = (notif: EntryNotification) => {
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notif));
};

export const getTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addTransaction = (transaction: Transaction) => {
  const txs = getTransactions();
  txs.push(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
};

export const incrementActiveTime = (seconds: number): UserProfile | null => {
  const user = getUser();
  if (user) {
    user.activeSecondsToday = (user.activeSecondsToday || 0) + seconds;
    saveUser(user);
    return user;
  }
  return null;
};

export const getAppSetting = (key: string): string => {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return settings[key] || '';
  } catch {
    return '';
  }
};

export const setAppSetting = (key: string, value: string) => {
  const raw = localStorage.getItem(APP_SETTINGS_KEY);
  const settings = raw ? JSON.parse(raw) : {};
  settings[key] = value;
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
};
