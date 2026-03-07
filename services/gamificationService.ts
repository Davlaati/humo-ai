
import { Badge, Achievement, UserProfile } from "../types";
import { saveUser } from "./storageService";

export const BADGE_DEFINITIONS: Record<string, Badge> = {
  bronze: { id: 'bronze', name: 'Bronze Explorer', description: '7 kunlik streak', icon: 'fa-feather', category: 'streak', requirement: 7, color: '#cd7f32', type: 'shield' },
  silver: { id: 'silver', name: 'Silver Scholar', description: '30 kunlik streak', icon: 'fa-feather', category: 'streak', requirement: 30, color: '#c0c0c0', type: 'shield' },
  gold: { id: 'gold', name: 'Gold Master', description: '100 ta dars yakunlandi', icon: 'fa-feather', category: 'learning', requirement: 100, color: '#ffd700', type: 'shield' },
  blue: { id: 'blue', name: 'Polyglot', description: '10 ta suhbat sessiyasi', icon: 'fa-microphone', category: 'social', requirement: 10, color: '#3b82f6', type: 'hex' },
  red: { id: 'red', name: 'Elite', description: '1000 XP to\'plandi', icon: 'fa-bolt', category: 'learning', requirement: 1000, color: '#ef4444', type: 'hex' },
  green: { id: 'green', name: 'Grammar Ninja', description: '50 ta so\'z o\'zlashtirildi', icon: 'fa-check-double', category: 'learning', requirement: 50, color: '#10b981', type: 'hex' },
};

export const calculateLevel = (xp: number) => {
  // Level formula: L = floor(sqrt(XP / 50)) + 1
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const currentLevelXp = Math.pow(level - 1, 2) * 50;
  const nextLevelXp = Math.pow(level, 2) * 50;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  
  return { level, progress };
};

export const checkAchievements = (user: UserProfile): Achievement[] => {
  const currentAchievements = user.badges || [];
  const newAchievements: Achievement[] = [...currentAchievements];
  let changed = false;

  Object.values(BADGE_DEFINITIONS).forEach(badge => {
    const alreadyHas = currentAchievements.find(a => a.badgeId === badge.id);
    if (alreadyHas) return;

    let unlocked = false;
    const streak = user.streak || 0;
    const xp = user.xp || 0;
    const mastered = user.learnedWords?.filter(w => w.mastered).length || 0;

    switch (badge.id) {
      case 'bronze': if (streak >= 7) unlocked = true; break;
      case 'silver': if (streak >= 30) unlocked = true; break;
      case 'red': if (xp >= 1000) unlocked = true; break;
      case 'green': if (mastered >= 50) unlocked = true; break;
    }

    if (unlocked) {
      newAchievements.push({
        badgeId: badge.id,
        unlockedAt: new Date().toISOString()
      });
      changed = true;
    }
  });

  return changed ? newAchievements : currentAchievements;
};

export const awardXP = (user: UserProfile, amount: number): UserProfile => {
  console.log("Awarding XP:", amount, "Current XP:", user.xp);
  const updatedUser = { ...user };
  updatedUser.xp = (updatedUser.xp || 0) + amount;
  console.log("New XP:", updatedUser.xp);
  
  const { progress } = calculateLevel(updatedUser.xp);
  updatedUser.level_progress = progress;
  
  const newBadges = checkAchievements(updatedUser);
  if (newBadges.length !== (updatedUser.badges?.length || 0)) {
    updatedUser.badges = newBadges;
  }
  
  saveUser(updatedUser);
  return updatedUser;
};

export const awardCoins = (user: UserProfile, amount: number): UserProfile => {
  const updatedUser = { ...user };
  updatedUser.coins += amount;
  
  const newBadges = checkAchievements(updatedUser);
  if (newBadges.length !== (updatedUser.badges?.length || 0)) {
    updatedUser.badges = newBadges;
  }
  
  saveUser(updatedUser);
  return updatedUser;
};
