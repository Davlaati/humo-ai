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
        localStorage.removeItem(USER_KEY);
        return null;
    }
    
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
    
    return user as UserProfile;
  } catch (e) {
    return null;
  }
};

export const saveUser = (user: UserProfile) => {
  try {
    const userData = { ...user };
    if (!userData.settings) userData.settings = { language: 'Uz', theme: 'dark' };
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (e) {}
};

export const getLeaderboardData = (period: LeaderboardPeriod, currentUser: UserProfile): Promise<LeaderboardEntry[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Realroq ismlar va natijalar
            const mockData = [
                { name: "Malika", xp: period === 'weekly' ? 1283 : 4500, wins: 12 },
                { name: "Sardor", xp: period === 'weekly' ? 1090 : 4200, wins: 9 },
                { name: "Sherzod", xp: period === 'weekly' ? 1072 : 4100, wins: 10 },
                { name: "Nigora", xp: period === 'weekly' ? 1056 : 3900, wins: 8 },
                { name: "Jasur", xp: period === 'weekly' ? 1027 : 3850, wins: 8 },
                { name: "Zaynab", xp: period === 'weekly' ? 1011 : 3700, wins: 8 },
                { name: "Umida", xp: period === 'weekly' ? 987 : 3600, wins: 8 },
                { name: "Bobur", xp: period === 'weekly' ? 961 : 3500, wins: 8 },
                { name: "Otabek", xp: period === 'weekly' ? 868 : 3100, wins: 7 },
                { name: "Farrux", xp: period === 'weekly' ? 790 : 2900, wins: 6 },
                { name: "Anvar", xp: period === 'weekly' ? 640 : 2500, wins: 5 },
                { name: "Kamola", xp: period === 'weekly' ? 610 : 2400, wins: 5 },
                { name: "Zilola", xp: period === 'weekly' ? 580 : 2200, wins: 4 },
                { name: "Madina", xp: period === 'weekly' ? 550 : 2100, wins: 4 }
            ];

            const leaderboard: LeaderboardEntry[] = mockData.map((m, i) => ({
                userId: `user_${i}`,
                name: m.name,
                xp: m.xp,
                wins: m.wins,
                rank: 0,
                isCurrentUser: false,
                trend: Math.random() > 0.7 ? 'up' : 'same'
            }));
            
            // Joriy foydalanuvchini qo'shish
            leaderboard.push({
                userId: currentUser.id,
                name: currentUser.name,
                xp: currentUser.xp,
                wins: currentUser.wins || 0,
                rank: 0,
                isCurrentUser: true,
                trend: 'same'
            });

            const sorted = leaderboard.sort((a, b) => b.xp - a.xp);
            const finalData = sorted.map((u, index) => ({ ...u, rank: index + 1 }));
            
            resolve(finalData);
        }, 500);
    });
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

export const adminUpdateBalance = (stars: number, coins: number): UserProfile | null => {
  const user = getUser();
  if (!user) return null;

  const transaction: StarsTransaction = {
    id: `adm_${Date.now()}`,
    type: 'admin_bonus',
    amount: stars,
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  user.telegramStars += stars;
  user.coins += coins;
  if (user.telegramStars < 0) user.telegramStars = 0;
  if (user.coins < 0) user.coins = 0;
  
  user.starsHistory.unshift(transaction);
  saveUser(user);
  return user;
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

export const incrementActiveTime = (seconds: number): UserProfile | null => {
  const user = getUser();
  if (user) {
    user.activeSecondsToday = (user.activeSecondsToday || 0) + seconds;
    saveUser(user);
    return user;
  }
  return null;
};