
import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { fetchUserFromSupabase, syncUserToSupabase, subscribeToUserChanges } from '../services/supabaseService';
import { calculateStreak } from '../utils/streak';

export const useUserSync = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tg = (window as any).Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;

  const loadUser = useCallback(async () => {
    if (!tgUser) {
      setLoading(false);
      return;
    }

    try {
      const userId = String(tgUser.id);
      let profile = await fetchUserFromSupabase(userId);

      if (profile) {
        // Handle Streak Logic
        const { newStreak, shouldUpdate } = calculateStreak(profile.lastActiveDate, profile.streak);
        
        if (shouldUpdate) {
          profile = { ...profile, streak: newStreak, lastActiveDate: new Date().toISOString() };
          await syncUserToSupabase(profile);
        }
        
        setUser(profile);
      } else {
        // New User Initialization
        const now = new Date().toISOString();
        const newUser: UserProfile = {
          id: userId,
          name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
          username: tgUser.username || `user_${userId.slice(-4)}`,
          avatarUrl: tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          coins: 500,
          xp: 0,
          streak: 1,
          level: 'Beginner' as any,
          age: '18',
          goal: 'General',
          personalities: ['Kind'],
          studyMinutes: 0,
          practiceFrequency: 'Daily',
          interests: [],
          isPremium: false,
          lastActiveDate: now,
          joinedAt: now,
          telegramStars: 0,
          starsHistory: [],
          settings: { language: 'Uz', theme: 'dark' },
          activeSecondsToday: 0
        };
        await syncUserToSupabase(newUser);
        setUser(newUser);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tgUser]);

  useEffect(() => {
    loadUser();

    if (tgUser) {
      const subscription = subscribeToUserChanges(String(tgUser.id), (payload) => {
        // Realtime update from Admin or other source
        if (payload.new) {
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              isPremium: payload.new.premium_status,
              coins: payload.new.coins,
              xp: payload.new.xp,
              streak: payload.new.streak,
              interests: payload.new.interests,
              isBlocked: payload.new.is_blocked
            };
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [tgUser, loadUser]);

  const updateUser = async (updates: Partial<UserProfile>) => {
    const currentUser = user || {} as UserProfile;
    const updatedUser = { ...currentUser, ...updates } as UserProfile;
    
    // 1. Update Supabase FIRST (Requirement)
    await syncUserToSupabase(updatedUser);
    
    // 2. Update Local State
    setUser(updatedUser);
  };

  return { user, loading, error, updateUser, refresh: loadUser };
};
