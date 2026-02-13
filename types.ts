
export type Language = 'Uz' | 'Ru' | 'Eng';
export type ThemeMode = 'dark' | 'light';

// Fix: Module '"../types"' has no exported member 'SpeakingStatus'
export type SpeakingStatus = 'idle' | 'searching' | 'connected' | 'ended';
// Fix: Module '"../types"' has no exported member 'PartnerType'
export type PartnerType = 'ai' | 'user';

export enum EnglishLevel {
  Beginner = 'Beginner',
  Elementary = 'Elementary',
  PreIntermediate = 'Pre-Intermediate',
  Intermediate = 'Intermediate',
  UpperIntermediate = 'Upper-Intermediate',
  Advanced = 'Advanced',
}

export type TeachingPersonality = 'Kind' | 'Strict' | 'Relaxed' | 'Demanding' | 'Playful' | 'Serious' | 'Energetic' | 'Calm';

export interface AdminConfig {
  coinPrices: {
    humoPerStar: number;
    fiatPricePer100Humo: number;
  };
  apiEndpoints: {
    main: string;
    dictionary: string;
  };
  adminLinks: {
    support: string;
    channel: string;
  };
}

export interface EntryNotification {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  target: 'all' | 'has_coins' | 'no_coins';
  isActive: boolean;
  createdAt: string;
}

export interface StarsTransaction {
  id: string;
  type: 'conversion' | 'purchase' | 'admin_bonus' | 'admin_deduction' | 'refund';
  amount: number;
  costInHumo?: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  age: string;
  level: EnglishLevel;
  goal: string;
  personalities: TeachingPersonality[];
  studyMinutes: number;
  practiceFrequency: string;
  interests: string[];
  coins: number;
  totalCoinsPurchased: number;
  xp: number;
  wins?: number; 
  streak: number;
  lastActiveDate: string;
  lastSpinDate?: string;
  joinedAt: string;
  settings: {
    language: Language;
    theme: ThemeMode;
  };
  learnedWords?: Word[];
  activityLog?: string[];
  telegramStars: number;
  starsHistory: StarsTransaction[];
  // Fix: Property 'activeSecondsToday' does not exist on type 'UserProfile'
  activeSecondsToday?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  amount: number; 
  cost: number; 
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Word {
  term: string;
  definition: string;
  example: string;
  translation: string;
  mastered: boolean;
  level?: EnglishLevel;
  category?: string;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl?: string;
  xp: number;
  wins: number;
  rank: number;
  isCurrentUser: boolean;
  trend: 'up' | 'down' | 'same';
}
