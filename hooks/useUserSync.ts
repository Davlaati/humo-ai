import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserProfile } from '../types';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import { calculateStreak } from '../utils/streak';

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  xp: number | null;
  streak: number | null;
  premium_status: boolean | null;
  top_rating: number | null;
  last_active_date: string | null;
  joined_at: string | null;
  created_at?: string | null;
};

const USER_KEY = 'ravona_user';

const parseTelegramUser = (): TelegramUser | null => {
  const tg = (window as any).Telegram?.WebApp;
  const directUser = tg?.initDataUnsafe?.user;
  if (directUser?.id) return directUser as TelegramUser;

  if (!tg?.initData) return null;

  try {
    const params = new URLSearchParams(tg.initData);
    const rawUser = params.get('user');
    if (!rawUser) return null;
    const parsed = JSON.parse(rawUser);
    return parsed?.id ? (parsed as TelegramUser) : null;
  } catch {
    return null;
  }
};

const waitForTelegramInitData = async (maxWaitMs = 3000) => {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;

  const start = Date.now();
  while (!tg.initData && Date.now() - start < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

const defaultProfileFromTelegram = (tgUser: TelegramUser): UserProfile => {
  const nowIso = new Date().toISOString();
  return {
    id: String(tgUser.id),
    name: `${tgUser.first_name || 'User'}${tgUser.last_name ? ` ${tgUser.last_name}` : ''}`,
    username: tgUser.username || `user_${String(tgUser.id).slice(-4)}`,
    age: '18-24',
    level: 'Beginner' as any,
    goal: 'Improve English',
    personalities: ['Kind'],
    studyMinutes: 15,
    practiceFrequency: 'Daily',
    interests: [],
    coins: 0,
    xp: 0,
    streak: 0,
    lastActiveDate: nowIso,
    joinedAt: nowIso,
    avatarUrl: tgUser.photo_url || undefined,
    isPremium: false,
    telegramStars: 0,
    starsHistory: [],
    activityLog: [],
    learnedWords: [],
    settings: { language: 'Uz', theme: 'dark' },
  };
};

const toUserProfile = (row: ProfileRow, fallback: UserProfile): UserProfile => ({
  ...fallback,
  id: row.id,
  name: row.name || fallback.name,
  username: row.username || fallback.username,
  avatarUrl: row.avatar_url || fallback.avatarUrl,
  interests: Array.isArray(row.interests) ? row.interests : [],
  xp: row.xp ?? 0,
  streak: row.streak ?? 0,
  isPremium: Boolean(row.premium_status),
  wins: row.top_rating ?? fallback.wins,
  lastActiveDate: row.last_active_date || fallback.lastActiveDate,
  joinedAt: row.joined_at || row.created_at || fallback.joinedAt,
});

export const useUserSync = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSync = useMemo(() => isSupabaseConfigured && Boolean(supabase), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await waitForTelegramInitData();
      const tgUser = parseTelegramUser();
      if (!tgUser) {
        throw new Error('Telegram user not available');
      }

      const fallback = defaultProfileFromTelegram(tgUser);

      if (!canSync || !supabase) {
        const local = localStorage.getItem(USER_KEY);
        const localUser = local ? (JSON.parse(local) as UserProfile) : fallback;
        setUser(localUser);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id,name,username,avatar_url,interests,xp,streak,premium_status,top_rating,last_active_date,joined_at,created_at')
        .eq('id', String(tgUser.id))
        .maybeSingle();

      if (fetchError) throw fetchError;

      let mergedUser = data ? toUserProfile(data as ProfileRow, fallback) : fallback;

      if (!data) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: mergedUser.id,
          name: mergedUser.name,
          username: mergedUser.username,
          avatar_url: mergedUser.avatarUrl,
          interests: mergedUser.interests,
          xp: mergedUser.xp,
          streak: mergedUser.streak,
          premium_status: mergedUser.isPremium,
          top_rating: mergedUser.wins || 0,
          last_active_date: mergedUser.lastActiveDate,
          joined_at: mergedUser.joinedAt,
        });
        if (insertError) throw insertError;
      }

      const streakResult = calculateStreak(mergedUser.lastActiveDate, mergedUser.streak);
      if (streakResult.shouldUpdateLastActiveDate) {
        const nowIso = new Date().toISOString();

        const { error: streakError } = await supabase
          .from('profiles')
          .update({
            streak: streakResult.streak,
            last_active_date: nowIso,
          })
          .eq('id', mergedUser.id);

        if (streakError) throw streakError;

        mergedUser = {
          ...mergedUser,
          streak: streakResult.streak,
          lastActiveDate: nowIso,
        };
      }

      localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
      setUser(mergedUser);
    } catch (e: any) {
      setError(e?.message || 'Failed to sync user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [canSync]);

  const updateUser = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!user) throw new Error('User not initialized');
      if (!canSync || !supabase) throw new Error('Supabase is not configured');

      const payload: Record<string, any> = {
        name: patch.name ?? user.name,
        username: patch.username ?? user.username,
        avatar_url: patch.avatarUrl ?? user.avatarUrl,
        interests: Array.isArray(patch.interests) ? patch.interests : user.interests,
        xp: patch.xp ?? user.xp,
        streak: patch.streak ?? user.streak,
        premium_status: patch.isPremium ?? user.isPremium,
        top_rating: patch.wins ?? user.wins ?? 0,
        last_active_date: patch.lastActiveDate ?? user.lastActiveDate,
      };

      const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', user.id);
      if (updateError) throw updateError;

      const nextUser: UserProfile = {
        ...user,
        ...patch,
        interests: Array.isArray(patch.interests) ? patch.interests : user.interests,
      };

      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return nextUser;
    },
    [canSync, user]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user || !canSync || !supabase) return;

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        payload => {
          const next = payload.new as ProfileRow;
          if (!next) return;
          setUser(prev => (prev ? toUserProfile(next, prev) : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canSync, user]);

  return { user, loading, error, refresh, updateUser };
};
