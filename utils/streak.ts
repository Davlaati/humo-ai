export interface StreakResult {
  streak: number;
  shouldUpdateLastActiveDate: boolean;
}

/**
 * Streak rules:
 * - diff < 24h: do nothing
 * - 24h <= diff < 48h: +1 streak
 * - diff >= 48h: reset to 0
 */
export const calculateStreak = (
  lastActiveDate: string | null | undefined,
  currentStreak: number,
  now: Date = new Date()
): StreakResult => {
  const safeStreak = Number.isFinite(currentStreak) ? Math.max(0, currentStreak) : 0;

  if (!lastActiveDate) {
    return {
      streak: safeStreak,
      shouldUpdateLastActiveDate: true,
    };
  }

  const lastActive = new Date(lastActiveDate);
  if (Number.isNaN(lastActive.getTime())) {
    return {
      streak: safeStreak,
      shouldUpdateLastActiveDate: true,
    };
  }

  const diffMs = now.getTime() - lastActive.getTime();
  if (diffMs < 0) {
    return {
      streak: safeStreak,
      shouldUpdateLastActiveDate: false,
    };
  }

  const hours = diffMs / (1000 * 60 * 60);

  if (hours < 24) {
    return {
      streak: safeStreak,
      shouldUpdateLastActiveDate: false,
    };
  }

  if (hours < 48) {
    return {
      streak: safeStreak + 1,
      shouldUpdateLastActiveDate: true,
    };
  }

  return {
    streak: 0,
    shouldUpdateLastActiveDate: true,
  };
};
