
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

// UserSettings interface added to define user preferences
export interface UserSettings {
  language: Language;
  theme: 'light' | 'dark';
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
  telegramStars: number;
  starsHistory: StarsTransaction[];
  // Added settings property to UserProfile interface
  settings?: UserSettings;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  amount: number; 
  cost: number; 
  status: 'pending' | 'approved' | 'rejected';
  proofUrl?: string; 
  createdAt: string;
}

export interface Word {
  term: string;
  definition: string;
  example: string;
  translation: string;
  mastered: boolean;
}

export interface GameState {
  isFighting: boolean;
  score: number;
  timeLeft: number;
}

export type SpeakingStatus = 'idle' | 'searching' | 'matched' | 'connected' | 'ended';
export type PartnerType = 'user' | 'ai';

export interface SpeakingSession {
  id: string;
  partnerName: string;
  partnerType: PartnerType;
  durationSeconds: number;
  xpEarned: number;
  timestamp: string;
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
