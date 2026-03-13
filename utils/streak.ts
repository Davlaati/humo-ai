
export const calculateStreak = (lastActiveDate: string | null, currentStreak: number): { newStreak: number; shouldUpdate: boolean } => {
  if (!lastActiveDate) return { newStreak: 1, shouldUpdate: true };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(lastActiveDate);
  const lastStart = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.floor((todayStart.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { newStreak: currentStreak, shouldUpdate: false };
  } else if (diffDays === 1) {
    return { newStreak: currentStreak + 1, shouldUpdate: true };
  } else {
    // More than 1 day gap, reset to 0
    return { newStreak: 0, shouldUpdate: true };
  }
};
