
import { supabase } from './supabaseClient';
import { UserProfile, DictionaryItem, AdminLog, LeaderboardPeriod, LeaderboardEntry, PlatformAnalytics, EnglishLevel } from '../types';

export const syncUserToSupabase = async (user: UserProfile) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar_url: user.avatarUrl,
        coins: user.coins,
        xp: user.xp,
        streak: user.streak,
        is_premium: user.isPremium,
        is_blocked: user.isBlocked,
        telegram_stars: user.telegramStars,
        settings: user.settings,
        last_active: new Date().toISOString()
      });
    if (error) console.error('Error syncing user to Supabase:', error);
  } catch (e) {
    console.error('Supabase sync failed:', e);
  }
};

export const fetchUserFromSupabase = async (userId: string): Promise<Partial<UserProfile> | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      avatarUrl: data.avatar_url,
      coins: data.coins,
      xp: data.xp,
      streak: data.streak,
      isPremium: data.is_premium,
      isBlocked: data.is_blocked,
      telegramStars: data.telegram_stars,
      settings: data.settings
    };
  } catch (e) {
    return null;
  }
};

export const logAdminActionToSupabase = async (log: AdminLog) => {
  try {
    await supabase.from('admin_logs').insert({
      admin_id: log.adminId,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp,
      ip: log.ip
    });
  } catch (e) {}
};

export const saveDictionaryItemToSupabase = async (item: DictionaryItem) => {
  try {
    await supabase.from('dictionary').upsert({
      id: item.id,
      term: item.term,
      translation: item.translation,
      definition: item.definition,
      example: item.example,
      category: item.category
    });
  } catch (e) {}
};

export const fetchLeaderboardFromSupabase = async (period: LeaderboardPeriod): Promise<LeaderboardEntry[]> => {
  try {
    // In a real app, 'period' would filter by a 'created_at' or 'xp_this_week' column
    // For now, we'll just sort by total XP
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, xp, wins')
      .order('xp', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    return (data || []).map((u, index) => ({
      userId: u.id,
      name: u.name || 'Noma\'lum',
      xp: u.xp || 0,
      wins: u.wins || 0,
      rank: index + 1,
      isCurrentUser: false, // Will be set in the component
      trend: 'same'
    }));
  } catch (e) {
    console.error('Leaderboard fetch failed:', e);
    return [];
  }
};

export const fetchAllUsersFromSupabase = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('last_active', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(d => ({
      id: d.id,
      name: d.name || 'Noma\'lum',
      username: d.username || undefined,
      age: d.age || '',
      level: d.level || EnglishLevel.Beginner,
      goal: d.goal || '',
      personalities: d.personalities || [],
      studyMinutes: d.study_minutes || 0,
      practiceFrequency: d.practice_frequency || '',
      interests: d.interests || [],
      coins: d.coins || 0,
      xp: d.xp || 0,
      wins: d.wins || 0,
      streak: d.streak || 0,
      lastActiveDate: d.last_active || new Date().toISOString(),
      joinedAt: d.joined_at || new Date().toISOString(),
      avatarUrl: d.avatar_url || undefined,
      isPremium: d.is_premium || false,
      isBlocked: d.is_blocked || false,
      telegramStars: d.telegram_stars || 0,
      starsHistory: d.stars_history || [],
      settings: d.settings || { language: 'Uz', theme: 'dark' },
      activeSecondsToday: 0 // Local only
    }));
  } catch (e) {
    return [];
  }
};

export const fetchAnalyticsFromSupabase = async (): Promise<PlatformAnalytics> => {
  try {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: premiumUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true);
    
    // Summing revenue from a hypothetical transactions table
    // For now, we'll calculate a mock revenue based on premium users
    const revenue = (premiumUsers || 0) * 50; // $50 per premium
    
    return {
      dailyActiveUsers: totalUsers || 0,
      totalRevenue: revenue,
      aiRequestsCount: (totalUsers || 0) * 15, // Mock multiplier
      errorCount: 0
    };
  } catch (e) {
    return { dailyActiveUsers: 0, totalRevenue: 0, aiRequestsCount: 0, errorCount: 0 };
  }
};

export const updatePremiumStatusInSupabase = async (userId: string, isPremium: boolean) => {
  try {
    await supabase.from('profiles').update({ is_premium: isPremium }).eq('id', userId);
  } catch (e) {}
};
