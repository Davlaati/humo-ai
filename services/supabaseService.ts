
import { supabase } from './supabaseClient';
import { 
  UserProfile, Transaction, DictionaryItem, AdminLog, Discount, 
  SubscriptionPackage, LeaderboardPeriod, LeaderboardEntry, 
  PlatformAnalytics, Payment, AdminSettings, LibraryItem 
} from '../types';

export const syncUserToSupabase = async (user: UserProfile) => {
    const data: any = {
    id: user.id,
    name: user.name,
    username: user.username,
    avatar_url: user.avatarUrl,
    coins: user.coins,
    xp: user.xp,
    wins: user.wins || 0,
    streak: user.streak,
    is_premium: user.isPremium,
    premium_until: user.premiumUntil,
    is_temporary_premium: user.isTemporaryPremium,
    trial_expires_at: user.trialExpiresAt,
    interests: user.interests,
    telegram_stars: user.telegramStars,
    settings: {
      ...user.settings,
      isOnboarded: user.isOnboarded,
      age: user.age,
      level: user.level,
      goal: user.goal,
      personalities: user.personalities,
      studyMinutes: user.studyMinutes,
      practiceFrequency: user.practiceFrequency,
      joinedAt: user.joinedAt,
      lastActiveDate: new Date().toISOString(),
      isPrivate: user.isPrivate,
      followers: user.followers,
      following: user.following,
      bio: user.bio
    },
    is_blocked: user.isBlocked,
    is_onboarded: user.isOnboarded,
    story_reward_claimed: user.story_reward_claimed,
    wallet_reward_claimed: user.wallet_reward_claimed,
    referral_count: user.referral_count,
    referred_by: user.referred_by,
    age: user.age,
    level: user.level,
    goal: user.goal,
    personalities: user.personalities,
    study_minutes: user.studyMinutes,
    practice_frequency: user.practiceFrequency
  };

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(data);
    
    if (error) {
      console.warn('Full upsert failed, trying minimal upsert...', error);
      
      // Fallback 1: Try with columns that are most likely to exist
      const minimalData: any = {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar_url: user.avatarUrl,
        coins: user.coins,
        xp: user.xp,
        streak: user.streak,
        is_premium: user.isPremium,
        premium_until: user.premiumUntil,
        trial_expires_at: user.trialExpiresAt,
        settings: data.settings
      };
      
      // Try to include is_onboarded if it might exist
      if (user.isOnboarded !== undefined) {
        minimalData.is_onboarded = user.isOnboarded;
      }

      const { error: minError } = await supabase.from('profiles').upsert(minimalData);
      
      if (minError) {
        console.warn('Minimal upsert failed, trying absolute minimum (ID + Settings)...', minError);
        // Fallback 2: Absolute minimum - just ID and the JSONB settings column
        const absoluteMinData = {
          id: user.id,
          settings: data.settings,
          name: user.name // Name is usually required
        };
        const { error: absError } = await supabase.from('profiles').upsert(absoluteMinData);
        if (absError) throw absError;
      }
    }
  } catch (e) {
    console.error('Supabase sync failed:', e);
    throw e;
  }
};

export const fetchUserFromSupabase = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Explicitly not found
      }
      console.error('Supabase fetch error:', error);
      throw error; // Network or other error
    }
    
    if (!data) return null;
    
    const settings = data.settings || {};
    const isOnboarded = data.is_onboarded === true || settings.isOnboarded === true;
    
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
      premiumUntil: data.premium_until,
      isTemporaryPremium: data.is_temporary_premium,
      trialExpiresAt: data.trial_expires_at,
      interests: data.interests || settings.interests || [],
      lastActiveDate: data.last_active_date || settings.lastActiveDate || new Date().toISOString(),
      telegramStars: data.telegram_stars,
      settings: settings,
      isBlocked: data.is_blocked,
      isOnboarded: isOnboarded,
      story_reward_claimed: data.story_reward_claimed,
      wallet_reward_claimed: data.wallet_reward_claimed,
      referral_count: data.referral_count,
      referred_by: data.referred_by,
      age: data.age || settings.age || '18',
      level: data.level || settings.level || 'Beginner',
      goal: data.goal || settings.goal || 'General',
      personalities: data.personalities || settings.personalities || ['Kind'],
      studyMinutes: data.study_minutes || settings.studyMinutes || 0,
      practiceFrequency: data.practice_frequency || settings.practiceFrequency || 'Daily',
      joinedAt: data.joined_at || settings.joinedAt || new Date().toISOString(),
      activeSecondsToday: 0,
      isPrivate: settings.isPrivate || false,
      followers: settings.followers || [],
      following: settings.following || [],
      bio: settings.bio || ''
    } as UserProfile;
  } catch (e) {
    console.error('Fetch user failed:', e);
    throw e;
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
      .select('id, name, xp, wins, is_premium, settings')
      .order('xp', { ascending: false })
      .limit(100); // Increased limit to account for filtered private users
    
    if (error) {
      console.error('Leaderboard query error:', error);
      // Fallback: try without wins if it doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('id, name, xp, is_premium, settings')
        .order('xp', { ascending: false })
        .limit(100);
      
      if (fallbackError) throw fallbackError;
      return (fallbackData || [])
        .filter(u => !u.settings?.isPrivate)
        .slice(0, 50)
        .map((u, index) => ({
          userId: u.id,
          name: u.name || 'Noma\'lum',
          xp: u.xp || 0,
          wins: 0,
          rank: index + 1,
          isCurrentUser: false,
          trend: 'same',
          isPremium: u.is_premium
        }));
    }
    
    return (data || [])
      .filter(u => !u.settings?.isPrivate)
      .slice(0, 50)
      .map((u, index) => ({
        userId: u.id,
        name: u.name || 'Noma\'lum',
        xp: u.xp || 0,
        wins: u.wins || 0,
        rank: index + 1,
        isCurrentUser: false,
        trend: 'same',
        isPremium: u.is_premium
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
      isOnboarded: d.is_onboarded,
      story_reward_claimed: d.story_reward_claimed,
      wallet_reward_claimed: d.wallet_reward_claimed,
      referral_count: d.referral_count,
      referred_by: d.referred_by,
      telegramStars: d.telegram_stars,
      starsHistory: d.stars_history || [],
      settings: d.settings,
      joinedAt: d.joined_at || d.settings?.joinedAt || new Date().toISOString(),
      lastActiveDate: d.last_active_date || d.settings?.lastActiveDate || new Date().toISOString(),
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

// Library Methods
export const fetchLibraryItemsFromSupabase = async (type?: string): Promise<LibraryItem[]> => {
  try {
    let query = supabase.from('library').select('*').order('created_at', { ascending: false });
    if (type) {
      query = query.eq('type', type);
    }
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      thumbnail: item.thumbnail,
      type: item.type,
      level: item.level,
      category: item.category,
      contentUrl: item.content_url,
      author: item.author,
      duration: item.duration,
      pages: item.pages,
      createdAt: item.created_at,
      isActive: item.is_active,
      isPremium: item.is_premium,
      lessons: item.lessons || []
    }));
  } catch (e) {
    console.error('Fetch library items failed:', e);
    return [];
  }
};

export const saveLibraryItemToSupabase = async (item: Partial<LibraryItem>) => {
  const data = {
    id: item.id || undefined,
    title: item.title,
    description: item.description,
    thumbnail: item.thumbnail,
    type: item.type,
    level: item.level,
    category: item.category,
    content_url: item.contentUrl,
    author: item.author,
    duration: item.duration,
    pages: item.pages,
    is_active: item.isActive,
    is_premium: item.isPremium,
    lessons: item.lessons,
    created_at: item.createdAt || new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('library').upsert(data);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Save library item failed:', e);
    throw e;
  }
};

export const deleteLibraryItemFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase.from('library').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Delete library item failed:', e);
    throw e;
  }
};

export const uploadFileToSupabase = async (bucket: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error(`'${bucket}' nomli bucket topilmadi. Supabase dashboardda yaratilganligini tekshiring.`);
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.error('Upload failed:', e);
    throw e;
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
    console.log('Creating payment:', payment);
    const { data, error } = await supabase.from('payments').insert({
      user_id: payment.userId,
      user_name: payment.userName,
      user_email: payment.userEmail,
      amount: payment.amount,
      plan_selected: payment.planSelected,
      receipt_image_url: payment.receiptImageUrl,
      status: payment.status
    }).select().single();
    
    if (error) {
      console.error('Error creating payment in Supabase:', error);
      throw error;
    }
    
    console.log('Payment created successfully:', data);
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
    
    if (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }
    
    console.log('Fetched pending payments:', data);
    
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
    console.error('Fetch pending payments failed:', e);
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
    return { 
      paymentCardNumber: data.payment_card_number,
      privacyPolicyUrl: data.privacy_policy_url,
      termsOfUseUrl: data.terms_of_use_url,
      publicOfferUrl: data.public_offer_url
    };
  } catch (e) {
    return { paymentCardNumber: '8600 0000 0000 0000' };
  }
};

export const updateAdminSettingsInSupabase = async (settings: AdminSettings) => {
  try {
    const { error } = await supabase.from('admin_settings').upsert({ 
      id: 1, 
      payment_card_number: settings.paymentCardNumber,
      privacy_policy_url: settings.privacyPolicyUrl,
      terms_of_use_url: settings.termsOfUseUrl,
      public_offer_url: settings.publicOfferUrl
    });
    if (error) throw error;
  } catch (e) {
    console.error('Update admin settings failed:', e);
    throw e;
  }
};
