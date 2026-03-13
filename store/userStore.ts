import { create } from 'zustand';
import { UserProfile } from '../types';
import { calculateDaysLeft, calculateDaysUsed } from '../utils/dateUtils';

const resolvePremiumUntil = (user: UserProfile): string | null => {
  return (user as any).premium_until || user.premiumUntil || user.premiumExpiryDate || null;
};

const computePremiumState = (user: UserProfile) => {
  const premiumUntil = resolvePremiumUntil(user);
  const expiry = premiumUntil ? new Date(premiumUntil) : null;
  const isPremiumActive = user.isPremium === true && !!expiry && expiry > new Date();
  const daysLeft = isPremiumActive ? calculateDaysLeft(premiumUntil) : 0;
  return { isPremiumActive, daysLeft };
};

interface UserState {
  user: UserProfile | null;
  isPremiumActive: boolean;
  daysLeft: number;
  daysUsed: number;
  isSoundEnabled: boolean;
  isHapticEnabled: boolean;
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isPremiumActive: false,
  daysLeft: 0,
  daysUsed: 0,
  isSoundEnabled: true,
  isHapticEnabled: true,

  setUser: (user) => {
    if (!user) {
      set({ user: null, isPremiumActive: false, daysLeft: 0, daysUsed: 0 });
      return;
    }

    const { isPremiumActive, daysLeft } = computePremiumState(user);
    const daysUsed = calculateDaysUsed(user.joinedAt);

    set({ user, isPremiumActive, daysLeft, daysUsed });
  },

  updateUser: (updates) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    const { isPremiumActive, daysLeft } = computePremiumState(updatedUser);
    const daysUsed = calculateDaysUsed(updatedUser.joinedAt);

    set({ user: updatedUser, isPremiumActive, daysLeft, daysUsed });
  },

  setSoundEnabled: (enabled) => set({ isSoundEnabled: enabled }),
  setHapticEnabled: (enabled) => set({ isHapticEnabled: enabled }),
}));
