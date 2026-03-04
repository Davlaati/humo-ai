
export const calculateStreak = (lastActiveDate: string | null, currentStreak: number): { newStreak: number; shouldUpdate: boolean } => {
  if (!lastActiveDate) return { newStreak: 1, shouldUpdate: true };

  const lastActive = new Date(lastActiveDate).getTime();
  const now = new Date().getTime();
  const diffInHours = (now - lastActive) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    // Less than 24h, do nothing
    return { newStreak: currentStreak, shouldUpdate: false };
  } else if (diffInHours >= 24 && diffInHours < 48) {
    // Between 24h and 48h, increment
    return { newStreak: currentStreak + 1, shouldUpdate: true };
  } else {
    // More than 48h, reset to 0 (as requested)
    return { newStreak: 0, shouldUpdate: true };
  }
};
