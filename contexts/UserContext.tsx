import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  interests: string[];
  xp: number;
  level: number;
  streak: number;
  is_premium: boolean;
  last_active_date: string | null;
  created_at?: string;
  updated_at?: string;
}

type UserContextValue = {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateInterests: (newInterests: string[]) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  setPremiumStatus: (isPremium: boolean) => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

const DEFAULT_USERNAME_PREFIX = 'user';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const buildFallbackUsername = (telegramId: string) => `${DEFAULT_USERNAME_PREFIX}_${telegramId.slice(-6)}`;

const normalizeProfile = (row: Partial<UserProfile> & { id: string }): UserProfile => ({
  id: row.id,
  username: row.username ?? buildFallbackUsername(row.id),
  full_name: row.full_name ?? null,
  avatar_url: row.avatar_url ?? null,
  interests: Array.isArray(row.interests) ? row.interests : [],
  xp: Number(row.xp ?? 0),
  level: Number(row.level ?? 1),
  streak: Number(row.streak ?? 0),
  is_premium: Boolean(row.is_premium ?? false),
  last_active_date: row.last_active_date ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const toErrorMessage = (error: PostgrestError | Error | unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'Unexpected error while syncing profile.';
};

const resolveTelegramUser = (): { id: string; username?: string; first_name?: string; last_name?: string; photo_url?: string } => {
  const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!tgUser?.id) {
    throw new Error('Telegram user id is not available in initDataUnsafe.user.id');
  }
  return {
    id: String(tgUser.id),
    username: tgUser.username,
    first_name: tgUser.first_name,
    last_name: tgUser.last_name,
    photo_url: tgUser.photo_url,
  };
};

const applyStreakRules = (lastActiveDate: string | null, currentStreak: number, now: Date) => {
  if (!lastActiveDate) {
    return { streak: 1, shouldPersist: true };
  }

  const elapsed = now.getTime() - new Date(lastActiveDate).getTime();

  if (elapsed > DAY_IN_MS && elapsed < 2 * DAY_IN_MS) {
    return { streak: currentStreak + 1, shouldPersist: true };
  }

  if (elapsed > 2 * DAY_IN_MS) {
    return { streak: 0, shouldPersist: true };
  }

  return { streak: currentStreak, shouldPersist: true };
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tgUser = resolveTelegramUser();

      const baseProfile = {
        id: tgUser.id,
        username: tgUser.username ?? buildFallbackUsername(tgUser.id),
        full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null,
        avatar_url: tgUser.photo_url ?? null,
      };

      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, interests, xp, level, streak, is_premium, last_active_date, created_at, updated_at')
        .eq('id', tgUser.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const now = new Date();

      if (!existing) {
        const payload = {
          ...baseProfile,
          interests: [],
          xp: 0,
          level: 1,
          streak: 1,
          is_premium: false,
          last_active_date: now.toISOString(),
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(payload)
          .select('id, username, full_name, avatar_url, interests, xp, level, streak, is_premium, last_active_date, created_at, updated_at')
          .single();

        if (insertError) throw insertError;
        setUser(normalizeProfile(inserted));
        return;
      }

      const normalized = normalizeProfile(existing);
      const { streak } = applyStreakRules(normalized.last_active_date, normalized.streak, now);

      const patch = {
        username: baseProfile.username,
        full_name: baseProfile.full_name,
        avatar_url: baseProfile.avatar_url,
        streak,
        last_active_date: now.toISOString(),
      };

      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', tgUser.id)
        .select('id, username, full_name, avatar_url, interests, xp, level, streak, is_premium, last_active_date, created_at, updated_at')
        .single();

      if (updateError) throw updateError;
      setUser(normalizeProfile(updated));
    } catch (err) {
      setError(toErrorMessage(err));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const updateInterests = useCallback(async (newInterests: string[]) => {
    if (!user) throw new Error('Cannot update interests: user is not loaded.');

    const sanitized = [...new Set(newInterests.map((item) => item.trim()).filter(Boolean))];

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ interests: sanitized })
      .eq('id', user.id)
      .select('id, username, full_name, avatar_url, interests, xp, level, streak, is_premium, last_active_date, created_at, updated_at')
      .single();

    if (updateError) throw updateError;
    setUser(normalizeProfile(data));
  }, [user]);

  const addXP = useCallback(async (amount: number) => {
    if (!user) throw new Error('Cannot add XP: user is not loaded.');
    if (!Number.isFinite(amount) || amount <= 0) return;

    const nextXp = user.xp + amount;
    const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ xp: nextXp, level: nextLevel })
      .eq('id', user.id)
      .select('id, username, full_name, avatar_url, interests, xp, level, streak, is_premium, last_active_date, created_at, updated_at')
      .single();

    if (updateError) throw updateError;
    setUser(normalizeProfile(data));
  }, [user]);

  const setPremiumStatus = useCallback(async (isPremium: boolean) => {
    if (!user) throw new Error('Cannot update premium status: user is not loaded.');

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ is_premium: isPremium })
      .eq('id', user.id)
      .select('id, username, full_name, avatar_url, interests, xp, level, streak, is_premium, last_active_date, created_at, updated_at')
      .single();

    if (updateError) throw updateError;
    setUser(normalizeProfile(data));
  }, [user]);

  const value = useMemo<UserContextValue>(() => ({
    user,
    loading,
    error,
    refreshProfile,
    updateInterests,
    addXP,
    setPremiumStatus,
  }), [user, loading, error, refreshProfile, updateInterests, addXP, setPremiumStatus]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside UserProvider');
  }
  return context;
};
