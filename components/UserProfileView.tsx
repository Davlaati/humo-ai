import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getUserProfile, followUser, unfollowUser, getUser, isPremiumActive } from '../services/storageService';
import { calculateLevel } from '../services/gamificationService';
import { ArrowLeft, UserPlus, UserMinus, Lock, Globe, Crown, ShieldCheck, Star, Zap, Trophy, Calendar } from 'lucide-react';
import { playTapSound } from '../services/audioService';

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onBack }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const fetchedUser = await getUserProfile(userId);
      const current = getUser();
      
      setUser(fetchedUser);
      setCurrentUser(current);
      
      if (current && fetchedUser) {
        setIsFollowing(current.following?.includes(fetchedUser.id) || false);
      }
      setLoading(false);
    };
    loadData();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!currentUser || !user) return;
    setFollowLoading(true);
    playTapSound();
    
    if (isFollowing) {
      const success = await unfollowUser(user.id);
      if (success) {
        setIsFollowing(false);
        setUser(prev => prev ? { ...prev, followers: (prev.followers || []).filter(id => id !== currentUser.id) } : null);
      }
    } else {
      const success = await followUser(user.id);
      if (success) {
        setIsFollowing(true);
        setUser(prev => prev ? { ...prev, followers: [...(prev.followers || []), currentUser.id] } : null);
      }
    }
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh] bg-[#0c1222]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center bg-[#0c1222] min-h-screen">
        <h2 className="text-xl font-bold text-red-400">Foydalanuvchi topilmadi</h2>
        <button onClick={onBack} className="mt-4 px-6 py-3 bg-white/10 rounded-xl text-white font-bold">Orqaga qaytish</button>
      </div>
    );
  }

  const { level } = calculateLevel(user.xp);
  const isPrivate = user.isPrivate || false;
  const isPremium = isPremiumActive(user);
  const canViewStats = !isPrivate || isFollowing || (currentUser?.isAdmin);

  return (
    <div className="fixed inset-0 z-50 bg-[#0c1222] flex flex-col animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
        <button 
          onClick={() => { playTapSound(); onBack(); }}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Profil</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        {/* Profile Card */}
        <div className={`relative p-8 rounded-[40px] mb-8 overflow-hidden border ${isPremium ? 'bg-gradient-to-br from-blue-600/20 to-indigo-900/40 border-blue-500/30 shadow-2xl shadow-blue-500/10' : 'bg-slate-800/40 border-white/5 shadow-xl'}`}>
          {isPremium && (
            <div className="absolute top-4 right-4 animate-pulse">
              <Crown className="w-8 h-8 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
            </div>
          )}
          
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className={`w-32 h-32 rounded-[40px] overflow-hidden border-4 ${isPremium ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-white/10'}`}>
                <img 
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {isPremium && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-2xl shadow-lg border-2 border-[#0c1222]">
                  <Star className="w-4 h-4 fill-current" />
                </div>
              )}
            </div>

            <h3 className="text-2xl font-black text-white tracking-tighter mb-1 flex items-center gap-2">
              {user.name}
              {isPremium && <ShieldCheck className="w-5 h-5 text-blue-400" />}
            </h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              @{user.username || 'user'}
            </p>

            <div className="flex space-x-2 mb-6">
               <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">Level {level}</span>
               {isPrivate ? (
                 <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/30 flex items-center gap-1">
                   <Lock className="w-3 h-3" /> Private
                 </span>
               ) : (
                 <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/30 flex items-center gap-1">
                   <Globe className="w-3 h-3" /> Public
                 </span>
               )}
            </div>

            <div className="flex items-center space-x-8 mb-8">
               <div className="text-center">
                 <p className="text-xl font-black text-white">{(user.followers || []).length}</p>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest">Followers</p>
               </div>
               <div className="text-center">
                 <p className="text-xl font-black text-white">{(user.following || []).length}</p>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest">Following</p>
               </div>
            </div>

            {currentUser && currentUser.id !== user.id && (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition active:scale-95 flex items-center gap-2 ${
                  isFollowing 
                    ? 'bg-white/10 text-gray-300 border border-white/5' 
                    : 'bg-blue-600 text-white shadow-blue-600/20'
                }`}
              >
                {followLoading ? (
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" /> Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {canViewStats ? (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <StatCard label="Total XP" value={user.xp} icon={<Zap className="w-5 h-5" />} color="text-yellow-400" />
            <StatCard label="Streak" value={`${user.streak} days`} icon={<Calendar className="w-5 h-5" />} color="text-orange-500" />
            <StatCard label="Ravona Score" value={user.ravonaScore || '0.0'} icon={<Trophy className="w-5 h-5" />} color="text-blue-400" />
            <StatCard label="Wins" value={user.wins || 0} icon={<Star className="w-5 h-5" />} color="text-green-400" />
          </div>
        ) : (
          <div className="glass-card rounded-[40px] p-12 text-center border border-white/5 mb-8 bg-slate-800/20">
            <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-gray-300 uppercase tracking-tighter">Hisob yopiq</h3>
            <p className="text-xs text-gray-500 mt-2 font-medium">Foydalanuvchi statistikasini ko'rish uchun unga obuna bo'ling.</p>
          </div>
        )}

        {/* Interests */}
        {canViewStats && user.interests && user.interests.length > 0 && (
          <div className="p-8 bg-slate-800/20 rounded-[40px] border border-white/5 shadow-xl mb-8">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Qiziqishlar</h4>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, i) => (
                <span key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-300">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {user.bio && (
          <div className="p-8 bg-slate-800/20 rounded-[40px] border border-white/5 shadow-xl mb-8">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Bio</h4>
            <p className="text-sm text-gray-300 italic leading-relaxed">"{user.bio}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="glass-card p-6 rounded-[32px] bg-slate-800/40 flex items-center space-x-4 border border-white/5 shadow-xl">
        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${color} shadow-inner border border-white/5`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest truncate">{label}</p>
            <p className="font-black text-lg text-white truncate tracking-tighter">{value}</p>
        </div>
    </div>
);

export default UserProfileView;
