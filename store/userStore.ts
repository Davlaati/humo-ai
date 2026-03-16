import { create } from 'zustand';
import { UserProfile } from '../types';
import { calculateDaysLeft, calculateDaysUsed } from '../utils/dateUtils';

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

    const daysLeft = user.premiumUntil ? calculateDaysLeft(user.premiumUntil) : 0;
    const daysUsed = calculateDaysUsed(user.joinedAt);
    const isPremiumActive = Boolean(
      user.isPremium === true && 
      (user.isTemporaryPremium || (user.premiumUntil && new Date(user.premiumUntil) > new Date()))
    );

    set({ user, isPremiumActive, daysLeft, daysUsed });
  },

  updateUser: (updates) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    const daysLeft = updatedUser.premiumUntil ? calculateDaysLeft(updatedUser.premiumUntil) : 0;
    const daysUsed = calculateDaysUsed(updatedUser.joinedAt);
    const isPremiumActive = Boolean(
      updatedUser.isPremium === true && 
      (updatedUser.isTemporaryPremium || (updatedUser.premiumUntil && new Date(updatedUser.premiumUntil) > new Date()))
    );

    set({ user: updatedUser, isPremiumActive, daysLeft, daysUsed });
  },

  setSoundEnabled: (enabled) => set({ isSoundEnabled: enabled }),
  setHapticEnabled: (enabled) => set({ isHapticEnabled: enabled }),
}));
