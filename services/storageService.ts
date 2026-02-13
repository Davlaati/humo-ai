
import { UserProfile, Transaction, LeaderboardEntry, LeaderboardPeriod, StarsTransaction, EntryNotification } from "../types";

const USER_KEY = 'humo_user';
const TRANSACTIONS_KEY = 'humo_transactions';
const NOTIFICATION_KEY = 'humo_entry_notification';
const CONVERSION_RATE = 10; 

export const getUser = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (!data || data === "undefined" || data === "null") return null;
    
    let user;
    try {
        user = JSON.parse(data);
    } catch (e) {
        console.error("JSON parse error for user data, clearing storage.");
        localStorage.removeItem(USER_KEY);
        return null;
    }
    
    // Telegram OAuth Integratsiyasi
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user;
      user.name = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');
      user.username = tgUser.username || user.username;
      user.avatarUrl = tgUser.photo_url || user.avatarUrl;
    }

    // Default qiymatlar (Crash bo'lishini oldini olish uchun)
    if (!user.settings) user.settings = { language: 'Uz', theme: 'dark' };
    if (user.telegramStars === undefined) user.telegramStars = 0;
    if (!user.starsHistory) user.starsHistory = [];
    if (user.xp === undefined) user.xp = 0;
    if (user.coins === undefined) user.coins = 0;
    if (user.streak === undefined) user.streak = 0;
    
    return user as UserProfile;
  } catch (e) {
    console.error("User storage read error:", e);
    return null;
  }
};

export const saveUser = (user: UserProfile) => {
  try {
    const userData = { ...user };
    if (!userData.settings) userData.settings = { language: 'Uz', theme: 'dark' };
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    // Theme classni bodyga qo'shish
    if (userData.settings && userData.settings.theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  } catch (e) {
    console.error("User storage save error:", e);
  }
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
  } catch (e) {
    return null;
  }
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
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
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
