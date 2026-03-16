
import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { fetchUserFromSupabase, syncUserToSupabase, subscribeToUserChanges } from '../services/supabaseService';
import { calculateStreak } from '../utils/streak';
import { useUserStore } from '../store/userStore';

export const useUserSync = () => {
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
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
        // Local fallback check
        const localOnboarded = localStorage.getItem(`ravona_onboarded_${userId}`);
        if (!profile.isOnboarded && localOnboarded === 'true') {
          profile.isOnboarded = true;
        }

        // Handle Streak Logic
        const { newStreak, shouldUpdate } = calculateStreak(profile.lastActiveDate, profile.streak);
        
        // Update Activity Log for Heatmap
        const todayStr = new Date().toISOString().split('T')[0];
        const currentLog = profile.activityLog || [];
        const updatedLog = currentLog.includes(todayStr) ? currentLog : [...currentLog, todayStr].slice(-100); // Keep last 100 days

        if (shouldUpdate || !currentLog.includes(todayStr)) {
          profile = { 
            ...profile, 
            streak: newStreak, 
            lastActiveDate: new Date().toISOString(),
            activityLog: updatedLog
          };
          await syncUserToSupabase(profile);
        }
        
        setUser(profile);
      } else {
        // This ONLY runs if profile is null (confirmed not found)
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
          isOnboarded: false,
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
      console.error('User sync error:', err);
      setError(err.message || 'Ma\'lumotlarni yuklashda xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
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
          useUserStore.getState().updateUser({
            isPremium: payload.new.is_premium,
            isTemporaryPremium: payload.new.is_temporary_premium,
            premiumUntil: payload.new.premium_until,
            trialExpiresAt: payload.new.trial_expires_at,
            coins: payload.new.coins,
            xp: payload.new.xp,
            streak: payload.new.streak,
            interests: payload.new.interests,
            isBlocked: payload.new.is_blocked
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [tgUser, loadUser]);

  const updateUser = async (updates: Partial<UserProfile>) => {
    try {
      const currentUser = user || {} as UserProfile;
      const updatedUser = { ...currentUser, ...updates } as UserProfile;
      
      // 1. Update Local State FIRST for immediate UI response
      setUser(updatedUser);
      
      // 2. Sync to Supabase in background
      try {
        await syncUserToSupabase(updatedUser);
      } catch (dbErr) {
        console.warn('Supabase sync failed, but local state updated:', dbErr);
        // We don't set error state here to avoid crashing the app
        // The data is still saved locally via storageService in other places
      }
    } catch (err: any) {
      console.error('Update user error:', err);
      // Only set error if even local update fails
    }
  };

  return { user, loading, error, updateUser, refresh: loadUser };
};
