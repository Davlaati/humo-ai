import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getUserProfile, followUser, unfollowUser, getUser } from '../services/storageService';
import { calculateLevel } from '../services/gamificationService';
import { getTranslation } from '../translations';
import { ArrowLeft, UserPlus, UserMinus, Lock, Globe, Users } from 'lucide-react';

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
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-400">User not found</h2>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-white/10 rounded-lg">Go Back</button>
      </div>
    );
  }

  const { level } = calculateLevel(user.xp);
  const isPrivate = user.isPrivate || false;
  // If public, everyone sees. If private, only followers see? Or maybe just hidden?
  // Prompt says: "ochiq qilsa hamma porfileni kora oladi" (if open, everyone can see).
  // Implicitly: if closed, people can't see details.
  // But usually basic info (name, avatar, bio) is visible, stats are hidden.
  const canViewStats = !isPrivate || isFollowing || (currentUser?.isAdmin);

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up relative">
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition z-10"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      <div className="flex flex-col items-center pt-8">
         <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 p-1 mb-4 shadow-xl">
             <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                 {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-3xl font-bold">{user.name.charAt(0)}</span>
                 )}
             </div>
         </div>
         <h2 className="text-2xl font-black">{user.name}</h2>
         <p className="text-gray-400 font-medium">@{user.username || 'user'}</p>
         
         {user.bio && (
           <p className="text-sm text-gray-300 mt-2 text-center max-w-xs px-4 italic">
             "{user.bio}"
           </p>
         )}

         <div className="flex space-x-2 mt-3">
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

         <div className="flex items-center space-x-6 mt-6 w-full justify-center">
            <div className="text-center">
              <p className="text-lg font-black text-white">{(user.followers || []).length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-white">{(user.following || []).length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Following</p>
            </div>
         </div>

         {currentUser && currentUser.id !== user.id && (
           <button
             onClick={handleFollowToggle}
             disabled={followLoading}
             className={`mt-6 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition active:scale-95 flex items-center gap-2 ${
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

      {canViewStats ? (
        <div className="grid grid-cols-2 gap-4 mt-6">
           <StatCard label="Total XP" value={user.xp} icon="fa-bolt" color="text-yellow-400" />
           <StatCard label="Streak" value={`${user.streak} days`} icon="fa-fire" color="text-orange-500" />
           <StatCard label="Learned Words" value={`${(user.learnedWords || []).length}`} icon="fa-brain" color="text-pink-400" />
           <StatCard label="Wins" value={`${user.wins || 0}`} icon="fa-chart-line" color="text-green-400" />
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center border border-white/5 mt-6">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-300">This Account is Private</h3>
          <p className="text-sm text-gray-500 mt-2">Follow this user to see their stats and achievements.</p>
        </div>
      )}
      
      {canViewStats && user.interests && user.interests.length > 0 && (
         <div className="glass-card rounded-2xl p-6 mt-4">
           <h3 className="font-bold mb-4">Interests</h3>
           <div className="flex flex-wrap gap-2">
               {user.interests.map(i => (
                   <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs border border-white/5">{i}</span>
               ))}
           </div>
         </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: string; color: string }> = ({ label, value, icon, color }) => (
    <div className="glass-card p-4 rounded-2xl flex items-center space-x-3 border border-white/5">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color} shadow-inner`}>
            <i className={`fa-solid ${icon} text-lg`}></i>
        </div>
        <div className="min-w-0">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest truncate">{label}</p>
            <p className="font-black text-sm truncate">{value}</p>
        </div>
    </div>
);

export default UserProfileView;
