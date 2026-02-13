
import { UserProfile, Transaction, LeaderboardEntry, LeaderboardPeriod, StarsTransaction, EntryNotification } from "../types";

const USER_KEY = 'humo_user';
const TRANSACTIONS_KEY = 'humo_transactions';
const NOTIFICATION_KEY = 'humo_entry_notification';
const CONVERSION_RATE = 10; // 1 Star = 10 Humo Coins

export const getUser = (): UserProfile | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  const user = JSON.parse(data);
  if (user.telegramStars === undefined) user.telegramStars = 0;
  if (!user.starsHistory) user.starsHistory = [];
  return user;
};

export const saveUser = (user: UserProfile) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getEntryNotification = (): EntryNotification | null => {
  const data = localStorage.getItem(NOTIFICATION_KEY);
  return data ? JSON.parse(data) : {
      id: 'welcome_v1',
      title: 'Xush kelibsiz!',
      description: 'Sizni yana Humo AI ilovasida ko\'rganimizdan mamnunmiz. Keling, bugun bilimlarimizni yanada oshiramiz!',
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
  if (!user) return null;
  
  const humoCost = starsAmount * CONVERSION_RATE;
  if (user.coins < humoCost) return null;

  const transaction: StarsTransaction = {
    id: `tx_${Date.now()}`,
    type: 'conversion',
    amount: starsAmount,
    costInHumo: humoCost,
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  user.coins -= humoCost;
  user.telegramStars += starsAmount;
  user.starsHistory.unshift(transaction);
  
  saveUser(user);
  return user;
};

export const purchaseStars = (starsAmount: number): UserProfile | null => {
  const user = getUser();
  if (!user) return null;

  const transaction: StarsTransaction = {
    id: `xtr_${Date.now()}`,
    type: 'purchase',
    amount: starsAmount,
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  user.telegramStars += starsAmount;
  user.starsHistory.unshift(transaction);
  
  saveUser(user);
  return user;
};

export const adminAdjustStars = (userId: string, amount: number, type: 'admin_bonus' | 'admin_deduction'): UserProfile | null => {
  const user = getUser();
  if (!user) return null;

  const transaction: StarsTransaction = {
    id: `adm_${Date.now()}`,
    type: type,
    amount: Math.abs(amount),
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  user.telegramStars += amount;
  if (user.telegramStars < 0) user.telegramStars = 0;
  user.starsHistory.unshift(transaction);
  
  saveUser(user);
  return user;
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addTransaction = (transaction: Transaction) => {
  const txs = getTransactions();
  txs.push(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
};

export const updateTransactionStatus = (id: string, status: 'approved' | 'rejected') => {
  const txs = getTransactions();
  const index = txs.findIndex(t => t.id === id);
  if (index !== -1) {
    txs[index].status = status;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
  }
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

export const getLeaderboardData = (period: LeaderboardPeriod, currentUser: UserProfile): Promise<LeaderboardEntry[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockUsers: LeaderboardEntry[] = Array.from({ length: 20 }).map((_, i) => {
                const baseXP = period === 'weekly' ? 500 : period === 'monthly' ? 2000 : 10000;
                const randomXP = Math.floor(Math.random() * baseXP);
                return {
                    userId: `mock_${i}`,
                    name: `User ${i + 1}`,
                    xp: randomXP,
                    wins: Math.floor(randomXP / 50),
                    rank: 0,
                    isCurrentUser: false,
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                };
            });
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
