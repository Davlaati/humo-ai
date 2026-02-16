
import { UserProfile } from '../types';

export interface StreakData {
  currentStreak: number;
  maxStreak: number;
  lastActiveDate: string; // ISO String (UTC)
  xpMultiplier: number;
}

/**
 * Validates and updates user streak based on activity.
 * Ensures only one increment per UTC day.
 */
export const validateAndUpdateStreak = (user: UserProfile): UserProfile => {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  
  // Initialize gamification data if missing
  const stats: StreakData = (user as any).streakStats || {
    currentStreak: user.streak || 0,
    maxStreak: user.streak || 0,
    lastActiveDate: '',
    xpMultiplier: 1
  };

  if (stats.lastActiveDate === todayUTC) {
    return user; // Already updated today
  }

  const lastDate = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;
  const yesterdayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)).toISOString();

  let newStreak = stats.currentStreak;

  if (!lastDate || stats.lastActiveDate === yesterdayUTC) {
    newStreak += 1;
  } else {
    newStreak = 1; // Streak broken
  }

  // Reward Logic
  let multiplier = 1;
  let isPremium = user.isPremium;

  if (newStreak >= 7) multiplier = 2;
  if (newStreak >= 30) isPremium = true;

  const updatedStats: StreakData = {
    currentStreak: newStreak,
    maxStreak: Math.max(newStreak, stats.maxStreak),
    lastActiveDate: todayUTC,
    xpMultiplier: multiplier
  };

  return {
    ...user,
    streak: newStreak,
    isPremium,
    // Extension property
    streakStats: updatedStats
  } as any;
};

/**
 * Safely wraps XP rewards with current multiplier
 */
export const calculateRewardXP = (user: UserProfile, baseXP: number): number => {
  const stats = (user as any).streakStats as StreakData;
  const multiplier = stats?.xpMultiplier || 1;
  return baseXP * multiplier;
};
