import { 
  UserProfile, Transaction, LeaderboardEntry, LeaderboardPeriod, 
  StarsTransaction, EntryNotification, SubscriptionPackage, 
  Discount, DictionaryItem, AdminLog, PlatformAnalytics 
} from "../types";
import { 
  syncUserToSupabase, logAdminActionToSupabase, saveDictionaryItemToSupabase,
  fetchLeaderboardFromSupabase, fetchAllUsersFromSupabase, fetchAnalyticsFromSupabase,
  updatePremiumStatusInSupabase
} from "./supabaseService";

const USER_KEY = 'ravona_user';
const TRANSACTIONS_KEY = 'ravona_transactions';
const NOTIFICATION_KEY = 'ravona_entry_notification';
const USERS_LIST_KEY = 'ravona_users_list';
const PACKAGES_KEY = 'ravona_subscription_packages';
const DISCOUNTS_KEY = 'ravona_discounts';
const DICTIONARY_KEY = 'ravona_dictionary_items';
const ADMIN_LOGS_KEY = 'ravona_admin_logs';
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
    
    // Sync to Supabase
    syncUserToSupabase(userData);
  } catch (e) {}
};

export const getLeaderboardData = async (period: LeaderboardPeriod, currentUser: UserProfile): Promise<LeaderboardEntry[]> => {
    const data = await fetchLeaderboardFromSupabase(period);
    
    // Ensure current user is in the list if not already
    const isCurrentInList = data.find(u => u.userId === currentUser.id);
    if (!isCurrentInList) {
        data.push({
            userId: currentUser.id,
            name: currentUser.name,
            xp: currentUser.xp,
            wins: currentUser.wins || 0,
            rank: 0,
            isCurrentUser: true,
            trend: 'same'
        });
    }

    return data.map(u => ({
        ...u,
        isCurrentUser: u.userId === currentUser.id
    })).sort((a, b) => b.xp - a.xp).map((u, i) => ({ ...u, rank: i + 1 }));
};

export const convertRavonaToStars = (starsAmount: number): UserProfile | null => {
  const user = getUser();
  if (!user) return null;
  
  const ravonaCost = starsAmount * CONVERSION_RATE;
  if (user.coins < ravonaCost) return null;

  const transaction: StarsTransaction = {
    id: `tx_${Date.now()}`,
    type: 'conversion',
    amount: starsAmount,
    costInRavona: ravonaCost,
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  user.coins -= ravonaCost;
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
        description: 'Sizni yana Ravona AI ilovasida ko\'rganimizdan mamnunmiz. Keling, bugun bilimlarimizni yanada oshiramiz!',
        buttonText: 'Darsni boshlash',
        buttonAction: { type: 'close', value: '' },
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

// --- Admin Management Methods ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
  return await fetchAllUsersFromSupabase();
};

export const saveAllUsers = (users: UserProfile[]) => {
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
};

export const updateOtherUser = async (userId: string, updates: Partial<UserProfile>) => {
  const users = await getAllUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveAllUsers(users);
    
    // If it's the current user, update them too
    const currentUser = getUser();
    if (currentUser && currentUser.id === userId) {
      saveUser({ ...currentUser, ...updates });
    }
  }
};

export const getSubscriptionPackages = (): SubscriptionPackage[] => {
  try {
    const data = localStorage.getItem(PACKAGES_KEY);
    return data ? JSON.parse(data) : [
      { id: '1', name: 'Premium Monthly', price: 50, durationDays: 30, features: ['AI Chat', 'No Ads', 'Exclusive Lessons'], isActive: true },
      { id: '2', name: 'Premium Yearly', price: 500, durationDays: 365, features: ['AI Chat', 'No Ads', 'Exclusive Lessons', 'Priority Support'], isActive: true }
    ];
  } catch (e) {
    return [];
  }
};

export const saveSubscriptionPackage = (pkg: SubscriptionPackage) => {
  const pkgs = getSubscriptionPackages();
  const index = pkgs.findIndex(p => p.id === pkg.id);
  if (index !== -1) pkgs[index] = pkg;
  else pkgs.push(pkg);
  localStorage.setItem(PACKAGES_KEY, JSON.stringify(pkgs));
};

export const getDiscounts = (): Discount[] => {
  try {
    const data = localStorage.getItem(DISCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveDiscount = (discount: Discount) => {
  const discounts = getDiscounts();
  const index = discounts.findIndex(d => d.id === discount.id);
  if (index !== -1) discounts[index] = discount;
  else discounts.push(discount);
  localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
};

export const deleteDiscount = (id: string) => {
  const discounts = getDiscounts().filter(d => d.id !== id);
  localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
};

export const getDictionaryItems = (): DictionaryItem[] => {
  try {
    const data = localStorage.getItem(DICTIONARY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveDictionaryItem = (item: DictionaryItem) => {
  const items = getDictionaryItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index !== -1) items[index] = item;
  else items.push(item);
  localStorage.setItem(DICTIONARY_KEY, JSON.stringify(items));
  
  // Sync to Supabase
  saveDictionaryItemToSupabase(item);
};

export const getAdminLogs = (): AdminLog[] => {
  try {
    const data = localStorage.getItem(ADMIN_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addAdminLog = (action: string, details: string) => {
  const logs = getAdminLogs();
  const user = getUser();
  const newLog: AdminLog = {
    id: `log_${Date.now()}`,
    adminId: user?.id || 'system',
    action,
    details,
    timestamp: new Date().toISOString(),
    ip: '127.0.0.1' // Mock IP
  };
  logs.unshift(newLog);
  localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(logs.slice(0, 100))); // Keep last 100
  
  // Sync to Supabase
  logAdminActionToSupabase(newLog);
};

export const getPlatformAnalytics = async (): Promise<PlatformAnalytics> => {
  return await fetchAnalyticsFromSupabase();
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

export const initializeFromSupabase = async (userId: string): Promise<UserProfile | null> => {
  const { fetchUserFromSupabase } = await import("./supabaseService");
  const remoteUser = await fetchUserFromSupabase(userId);
  if (remoteUser) {
    const fullUser = { ...remoteUser } as UserProfile;
    saveUser(fullUser);
    return fullUser;
  }
  return null;
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
