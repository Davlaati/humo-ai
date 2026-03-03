
import { UserProfile } from '../types';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  type: 'shield' | 'hex';
}

export const BADGE_DEFINITIONS: Record<string, Badge> = {
  bronze: { id: 'bronze', name: 'Bronze Explorer', icon: 'fa-feather', color: '#cd7f32', description: '7 Day Streak', type: 'shield' },
  silver: { id: 'silver', name: 'Silver Scholar', icon: 'fa-feather', color: '#c0c0c0', description: '30 Day Streak', type: 'shield' },
  gold: { id: 'gold', name: 'Gold Master', icon: 'fa-feather', color: '#ffd700', description: '100 Lessons Completed', type: 'shield' },
  blue: { id: 'blue', name: 'Polyglot', icon: 'fa-microphone', color: '#3b82f6', description: '10 Speaking Sessions', type: 'hex' },
  red: { id: 'red', name: 'Elite', icon: 'fa-bolt', color: '#ef4444', description: '1000 XP Earned', type: 'hex' },
  green: { id: 'green', name: 'Grammar Ninja', icon: 'fa-check-double', color: '#10b981', description: 'Mastered 50 words', type: 'hex' },
};

export const checkAchievements = (user: UserProfile): string[] => {
  const badges: string[] = (user as any).badges || [];
  const streak = user.streak || 0;
  const xp = user.xp || 0;
  const lessons = (user as any).completedLessons || 0;
  const speaking = (user as any).speakingSessionsCount || 0;
  const mastered = user.learnedWords?.filter(w => w.mastered).length || 0;

  const newBadges = [...badges];

  if (streak >= 7 && !newBadges.includes('bronze')) newBadges.push('bronze');
  if (streak >= 30 && !newBadges.includes('silver')) newBadges.push('silver');
  if (lessons >= 100 && !newBadges.includes('gold')) newBadges.push('gold');
  if (speaking >= 10 && !newBadges.includes('blue')) newBadges.push('blue');
  if (xp >= 1000 && !newBadges.includes('red')) newBadges.push('red');
  if (mastered >= 50 && !newBadges.includes('green')) newBadges.push('green');

  return newBadges;
};
