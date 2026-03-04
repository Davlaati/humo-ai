
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile, Transaction, DictionaryItem, AdminLog, Discount, SubscriptionPackage } from '../types';

const shouldUseSupabase = () => isSupabaseConfigured && Boolean(supabase);

const getSupabaseClient = () => {
  if (!supabase) throw new Error('Supabase client is not configured.');
  return supabase;
};

export const syncUserToSupabase = async (user: UserProfile) => {

  if (!shouldUseSupabase()) return;
  try {
    const { error } = await getSupabaseClient()
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
        is_temporary_premium: user.isTemporaryPremium,
        trial_expires_at: user.trialExpiresAt,
        premium_until: user.premiumUntil,
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

  if (!shouldUseSupabase()) return null;
  try {
    const { data, error } = await getSupabaseClient()
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
      isTemporaryPremium: data.is_temporary_premium,
      trialExpiresAt: data.trial_expires_at,
      premiumUntil: data.premium_until,
      isBlocked: data.is_blocked,
      telegramStars: data.telegram_stars,
      settings: data.settings
    };
  } catch (e) {
    return null;
  }
};

export const logAdminActionToSupabase = async (log: AdminLog) => {

  if (!shouldUseSupabase()) return;
  try {
    await getSupabaseClient().from('admin_logs').insert({
      admin_id: log.adminId,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp,
      ip: log.ip
    });
  } catch (e) {}
};

export const saveDictionaryItemToSupabase = async (item: DictionaryItem) => {

  if (!shouldUseSupabase()) return;
  try {
    await getSupabaseClient().from('dictionary').upsert({
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

  if (!shouldUseSupabase()) return [];
  try {
    // In a real app, 'period' would filter by a 'created_at' or 'xp_this_week' column
    // For now, we'll just sort by total XP
    const { data, error } = await getSupabaseClient()
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

  if (!shouldUseSupabase()) return [];
  try {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*')
      .order('last_active', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      username: d.username,
      avatarUrl: d.avatar_url,
      coins: d.coins,
      xp: d.xp,
      streak: d.streak,
      isPremium: d.is_premium,
      isBlocked: d.is_blocked,
      telegramStars: d.telegram_stars,
      settings: d.settings,
      activeSecondsToday: 0 // Local only
    }));
  } catch (e) {
    return [];
  }
};

export const fetchAnalyticsFromSupabase = async (): Promise<PlatformAnalytics> => {

  if (!shouldUseSupabase()) return { dailyActiveUsers: 0, totalRevenue: 0, aiRequestsCount: 0, errorCount: 0 };
  try {
    const { count: totalUsers } = await getSupabaseClient().from('profiles').select('*', { count: 'exact', head: true });
    const { count: premiumUsers } = await getSupabaseClient().from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true);
    
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

  if (!shouldUseSupabase()) return;
  try {
    await getSupabaseClient().from('profiles').update({ is_premium: isPremium }).eq('id', userId);
  } catch (e) {}
};

// Payment functions
export const createPaymentInSupabase = async (payment: Omit<Payment, 'id' | 'createdAt'>) => {

  if (!shouldUseSupabase()) return null;
  try {
    const { data, error } = await getSupabaseClient().from('payments').insert({
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

  if (!shouldUseSupabase()) return [];
  try {
    const { data, error } = await getSupabaseClient()
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

  if (!shouldUseSupabase()) return;
  try {
    await getSupabaseClient().from('payments').update({ status }).eq('id', paymentId);
  } catch (e) {}
};

// Admin Settings functions
export const fetchAdminSettingsFromSupabase = async (): Promise<AdminSettings | null> => {

  if (!shouldUseSupabase()) return { paymentCardNumber: '8600 0000 0000 0000' };
  try {
    const { data, error } = await getSupabaseClient().from('admin_settings').select('*').single();
    if (error) return { paymentCardNumber: '8600 0000 0000 0000' }; // Default fallback
    return { paymentCardNumber: data.payment_card_number };
  } catch (e) {
    return { paymentCardNumber: '8600 0000 0000 0000' };
  }
};

export const updateAdminSettingsInSupabase = async (settings: AdminSettings) => {

  if (!shouldUseSupabase()) return;
  try {
    await getSupabaseClient().from('admin_settings').upsert({ id: 1, payment_card_number: settings.paymentCardNumber });
  } catch (e) {}
};
