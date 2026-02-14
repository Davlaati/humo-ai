
export type Language = 'Uz' | 'Ru' | 'Eng';

export enum EnglishLevel {
  Beginner = 'Beginner',
  Elementary = 'Elementary',
  PreIntermediate = 'Pre-Intermediate',
  Intermediate = 'Intermediate',
  UpperIntermediate = 'Upper-Intermediate',
  Advanced = 'Advanced',
}

export type TeachingPersonality = 'Kind' | 'Strict' | 'Relaxed' | 'Demanding' | 'Playful' | 'Serious' | 'Energetic' | 'Calm';

// Added missing LeaderboardPeriod type
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

// Added missing LeaderboardEntry type
export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  wins: number;
  rank: number;
  isCurrentUser: boolean;
  trend: 'up' | 'same' | 'down';
}

// Added missing Transaction type
export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  timestamp: string;
}

// Added missing SpeakingStatus and PartnerType for SpeakingClub
export type SpeakingStatus = 'idle' | 'searching' | 'connected' | 'ended';
export type PartnerType = 'ai' | 'user';

export interface EntryNotification {
  id: string;
  image?: string;
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

export interface UserSettings {
  language: Language;
  theme: 'light' | 'dark';
}

export interface Word {
  term: string;
  definition: string;
  example: string;
  translation: string;
  mastered: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  age: string;
  level: EnglishLevel;
  goal: string;
  personalities: TeachingPersonality[];
  studyMinutes: number;
  practiceFrequency: string;
  interests: string[];
  coins: number;
  xp: number;
  wins?: number; 
  streak: number;
  lastActiveDate: string;
  lastSpinDate?: string;
  activeSecondsToday?: number; 
  activityLog?: string[]; 
  learnedWords?: Word[]; 
  avatarUrl?: string;
  joinedAt: string;
  isAdmin?: boolean;
  isPremium?: boolean;
  telegramStars: number;
  starsHistory: StarsTransaction[];
  settings?: UserSettings;
  status?: 'active' | 'blocked';
  aiRequestsCount?: number;
}

// Admin Specific Types
export interface AdminPayment {
  id: string;
  userId: string;
  username: string;
  amount: number;
  currency: 'XTR' | 'USD';
  status: 'pending' | 'paid' | 'failed';
  txId: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  type: 'info' | 'error' | 'action';
  message: string;
  adminName?: string;
  timestamp: string;
}

export interface AdminStats {
  totalUsers: number;
  active24h: number;
  newToday: number;
  totalPayments: number;
  aiRequests: number;
}
