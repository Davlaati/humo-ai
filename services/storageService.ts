
import { UserProfile, Transaction, LeaderboardEntry, LeaderboardPeriod, StarsTransaction, EntryNotification, AdminConfig } from "../types";

const USER_KEY = 'humo_user';
const TRANSACTIONS_KEY = 'humo_transactions';
const NOTIFICATION_KEY = 'humo_entry_notification';
const ADMIN_CONFIG_KEY = 'humo_admin_config';

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  coinPrices: { humoPerStar: 10, fiatPricePer100Humo: 15000 },
  apiEndpoints: { main: 'https://api.humoai.com/v1', dictionary: 'https://api.humoai.com/dict' },
  adminLinks: { support: 'https://t.me/humo_support', channel: 'https://t.me/humo_ai_news' }
};

export const getAdminConfig = (): AdminConfig => {
  const data = localStorage.getItem(ADMIN_CONFIG_KEY);
  return data ? JSON.parse(data) : DEFAULT_ADMIN_CONFIG;
};

export const saveAdminConfig = (config: AdminConfig) => {
  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
};

export const getUser = (): UserProfile | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  const user = JSON.parse(data);
  
  // Telegram OAuth Extraction
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user) {
    const tgUser = tg.initDataUnsafe.user;
    user.name = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
    user.username = tgUser.username;
    user.avatarUrl = tgUser.photo_url;
  }

  // Robust migration for existing users
  if (!user.settings) user.settings = { language: 'Uz', theme: 'dark' };
  if (user.telegramStars === undefined) user.telegramStars = 0;
  if (!user.starsHistory) user.starsHistory = [];
  if (user.totalCoinsPurchased === undefined) user.totalCoinsPurchased = 0;
  
  return user;
};

export const saveUser = (user: UserProfile) => {
  if (!user.settings) user.settings = { language: 'Uz', theme: 'dark' };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  // Apply visual theme
  if (user.settings.theme === 'light') {
    document.documentElement.classList.add('light-mode');
  } else {
    document.documentElement.classList.remove('light-mode');
  }
};

export const getEntryNotification = (): EntryNotification | null => {
  const data = localStorage.getItem(NOTIFICATION_KEY);
  return data ? JSON.parse(data) : {
      id: 'welcome_v1',
      title: 'Xush kelibsiz!',
      description: 'Sizni yana Humo AI ilovasida ko\'rganimizdan mamnunmiz.',
      buttonText: 'Darsni boshlash',
      target: 'all',
      isActive: true,
      createdAt: new Date().toISOString()
  };
};

export const saveEntryNotification = (notif: EntryNotification) => {
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notif));
};

export const convertHumoToStars = (starsAmount: number): UserProfile | null => {
  const user = getUser();
  const config = getAdminConfig();
  if (!user) return null;
  const cost = starsAmount * config.coinPrices.humoPerStar;
  if (user.coins < cost) return null;
  user.coins -= cost;
  user.telegramStars += starsAmount;
  user.starsHistory.unshift({
    id: `tx_${Date.now()}`, type: 'conversion', amount: starsAmount, costInHumo: cost, status: 'completed', timestamp: new Date().toISOString()
  });
  saveUser(user);
  return user;
};

export const purchaseStars = (starsAmount: number): UserProfile | null => {
  const user = getUser();
  if (!user) return null;
  user.telegramStars += starsAmount;
  user.starsHistory.unshift({
    id: `xtr_${Date.now()}`, type: 'purchase', amount: starsAmount, status: 'completed', timestamp: new Date().toISOString()
  });
  saveUser(user);
  return user;
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

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const updateTransactionStatus = (id: string, status: 'approved' | 'rejected') => {
  const txs = getTransactions();
  const index = txs.findIndex(t => t.id === id);
  if (index !== -1) {
    txs[index].status = status;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
  }
};

export const getLeaderboardData = (period: LeaderboardPeriod, currentUser: UserProfile): Promise<LeaderboardEntry[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockUsers: LeaderboardEntry[] = Array.from({ length: 15 }).map((_, i) => ({
                userId: `mock_${i}`,
                name: `Top User ${i + 1}`,
                xp: period === 'weekly' ? 800 - i * 50 : 5000 - i * 300,
                wins: 10 - i,
                rank: i + 1,
                isCurrentUser: false,
                trend: Math.random() > 0.5 ? 'up' : 'down'
            }));
            mockUsers.push({
                userId: currentUser.id,
                name: currentUser.name,
                xp: currentUser.xp,
                wins: currentUser.wins || 0,
                rank: 0,
                isCurrentUser: true,
                trend: 'same'
            });
            mockUsers.sort((a, b) => b.xp - a.xp);
            resolve(mockUsers.map((u, index) => ({ ...u, rank: index + 1 })));
        }, 600);
    });
};
