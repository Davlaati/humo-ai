
import { supabase } from './supabaseClient';
import { 
  UserProfile, Transaction, DictionaryItem, AdminLog, Discount, 
  SubscriptionPackage, LeaderboardPeriod, LeaderboardEntry, 
  PlatformAnalytics, Payment, AdminSettings 
} from '../types';

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
        wins: user.wins || 0,
        streak: user.streak,
        is_premium: user.isPremium,
        interests: user.interests,
        last_active_date: new Date().toISOString(),
        telegram_stars: user.telegramStars,
        settings: user.settings,
        is_blocked: user.isBlocked
      });
    if (error) console.error('Error syncing user to Supabase:', error);
  } catch (e) {
    console.error('Supabase sync failed:', e);
  }
};

export const fetchUserFromSupabase = async (userId: string): Promise<UserProfile | null> => {
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
      wins: data.wins || 0,
      streak: data.streak,
      isPremium: data.is_premium,
      interests: data.interests || [],
      lastActiveDate: data.last_active_date,
      telegramStars: data.telegram_stars,
      settings: data.settings,
      isBlocked: data.is_blocked,
      age: data.age || '18',
      level: data.level || 'Beginner',
      goal: data.goal || 'General',
      personalities: data.personalities || ['Kind'],
      studyMinutes: data.study_minutes || 0,
      practiceFrequency: data.practice_frequency || 'Daily',
      joinedAt: data.joined_at || new Date().toISOString(),
      activeSecondsToday: 0
    } as UserProfile;
  } catch (e) {
    return null;
  }
};

export const subscribeToUserChanges = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`public:profiles:id=eq.${userId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, callback)
    .subscribe();
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
    
    if (error) {
      console.error('Leaderboard query error:', error);
      // Fallback: try without wins if it doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('id, name, xp')
        .order('xp', { ascending: false })
        .limit(50);
      
      if (fallbackError) throw fallbackError;
      return (fallbackData || []).map((u, index) => ({
        userId: u.id,
        name: u.name || 'Noma\'lum',
        xp: u.xp || 0,
        wins: 0,
        rank: index + 1,
        isCurrentUser: false,
        trend: 'same'
      }));
    }
    
    return (data || []).map((u, index) => ({
      userId: u.id,
      name: u.name || 'Noma\'lum',
      xp: u.xp || 0,
      wins: u.wins || 0,
      rank: index + 1,
      isCurrentUser: false,
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
      .order('xp', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      username: d.username,
      age: d.age || '18',
      level: d.level || 'Beginner',
      goal: d.goal || 'General',
      personalities: d.personalities || ['Kind'],
      studyMinutes: d.study_minutes || 0,
      practiceFrequency: d.practice_frequency || 'Daily',
      interests: d.interests || [],
      avatarUrl: d.avatar_url,
      coins: d.coins,
      xp: d.xp,
      wins: d.wins || 0,
      streak: d.streak,
      isPremium: d.is_premium,
      isTemporaryPremium: d.is_temporary_premium,
      trialExpiresAt: d.trial_expires_at,
      premiumUntil: d.premium_until,
      isBlocked: d.is_blocked,
      telegramStars: d.telegram_stars,
      starsHistory: d.stars_history || [],
      settings: d.settings,
      joinedAt: d.joined_at || new Date().toISOString(),
      lastActiveDate: d.last_active_date || new Date().toISOString(),
      activeSecondsToday: 0
    }));
  } catch (e) {
    console.error('Fetch all users failed:', e);
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

// Payment functions
export const createPaymentInSupabase = async (payment: Omit<Payment, 'id' | 'createdAt'>) => {
  try {
    const { data, error } = await supabase.from('payments').insert({
      user_id: payment.userId,
      user_name: payment.userName,
      user_email: payment.userEmail,
      amount: payment.amount,
      plan_selected: payment.planSelected,
      receipt_image_url: payment.receiptImageUrl,
      status: payment.status
    }).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Error creating payment:', e);
    return null;
  }
};

export const fetchPendingPaymentsFromSupabase = async (): Promise<Payment[]> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(d => ({
      id: d.id,
      userId: d.user_id,
      userName: d.user_name,
      userEmail: d.user_email,
      amount: d.amount,
      planSelected: d.plan_selected,
      receiptImageUrl: d.receipt_image_url,
      status: d.status,
      createdAt: d.created_at
    }));
  } catch (e) {
    return [];
  }
};

export const updatePaymentStatusInSupabase = async (paymentId: string, status: 'approved' | 'rejected') => {
  try {
    await supabase.from('payments').update({ status }).eq('id', paymentId);
  } catch (e) {}
};

// Admin Settings functions
export const fetchAdminSettingsFromSupabase = async (): Promise<AdminSettings | null> => {
  try {
    const { data, error } = await supabase.from('admin_settings').select('*').single();
    if (error) return { paymentCardNumber: '8600 0000 0000 0000' }; // Default fallback
    return { paymentCardNumber: data.payment_card_number };
  } catch (e) {
    return { paymentCardNumber: '8600 0000 0000 0000' };
  }
};

export const updateAdminSettingsInSupabase = async (settings: AdminSettings) => {
  try {
    await supabase.from('admin_settings').upsert({ id: 1, payment_card_number: settings.paymentCardNumber });
  } catch (e) {}
};
