
import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import UserBadges from './UserBadges';
import { calculateLevel } from '../services/gamificationService';
import { isPremiumActive } from '../services/storageService';
import { getTranslation } from '../translations';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onShowAdmin?: () => void;
  onShowPremium?: () => void;
}

const INTERESTS_OPTIONS = ['Technology', 'Business', 'Travel', 'Movies', 'Music', 'Sports', 'Gaming', 'Food', 'Fashion', 'Art', 'Science', 'History'];

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onShowAdmin, onShowPremium }) => {
  const { level, progress } = calculateLevel(user.xp);
  const isPremium = isPremiumActive(user);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [editedInterests, setEditedInterests] = useState<string[]>(user.interests);
  const lang = user.settings?.language || 'Uz';

  // Admin Login States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const toggleInterest = (interest: string) => {
    if (editedInterests.includes(interest)) {
      setEditedInterests(prev => prev.filter(i => i !== interest));
    } else {
      if (editedInterests.length < 8) {
        setEditedInterests(prev => [...prev, interest]);
      }
    }
  };

  const handleSaveInterests = () => {
    if (editedInterests.length < 3) {
      alert(getTranslation('min_interests', lang));
      return;
    }
    onUpdateUser({ ...user, interests: editedInterests });
    setIsEditingInterests(false);
  };

  const handleAdminAuth = () => {
    if (adminLogin === 'davlaati' && adminPassword === '337520209') {
        if (onShowAdmin) onShowAdmin();
        setShowLoginModal(false);
        setAdminLogin('');
        setAdminPassword('');
        setLoginError('');
    } else {
        setLoginError("Login yoki parol noto'g'ri!");
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up relative">
      <div className="flex flex-col items-center pt-8">
         <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 p-1 mb-4 shadow-xl">
             <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                 <span className="text-3xl font-bold">{user.name.charAt(0)}</span>
             </div>
         </div>
         <h2 className="text-2xl font-black">{user.name}</h2>
         
         {/* Premium / Trial Status Badge */}
         {isPremium ? (
            <div className="mt-2 px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-full text-xs font-black uppercase tracking-widest border border-yellow-400 shadow-lg shadow-yellow-600/20 flex items-center gap-2 animate-pulse">
              <i className="fa-solid fa-crown"></i> Premium
            </div>
         ) : user.trialExpiresAt && new Date(user.trialExpiresAt).getTime() > Date.now() ? (
            <div className="mt-2 px-4 py-1.5 bg-slate-800 text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-700 flex items-center gap-2">
              <i className="fa-regular fa-clock"></i> 
              Trial: {Math.ceil((new Date(user.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
            </div>
         ) : (
            <div className="mt-2 px-4 py-1.5 bg-red-900/50 text-red-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-800 flex items-center gap-2">
              <i className="fa-solid fa-lock"></i> Trial Expired
            </div>
         )}

         {user.ravonaScore && (
           <div className="mt-3 flex flex-col items-center">
             <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest border border-blue-400 shadow-lg shadow-blue-600/20">
               Ravona Score: {user.ravonaScore}
             </div>
             <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest mt-1">
               IELTS Equivalent: {user.ravonaScore >= 11 ? '8.5 - 9.0' : user.ravonaScore >= 9 ? '7.0 - 8.0' : user.ravonaScore >= 7 ? '5.5 - 6.5' : user.ravonaScore >= 5 ? '4.0 - 5.0' : 'Below 4.0'}
             </p>
           </div>
         )}
         <p className="text-gray-400 font-medium">@{user.username || 'user'}</p>
         <div className="flex space-x-2 mt-2">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">{getTranslation('level', lang)} {level}</span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/30">{user.level}</span>
         </div>
      </div>

      {/* Premium Banner if not premium */}
      {!isPremium && (
        <div className="glass-card rounded-3xl p-6 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <i className="fa-solid fa-crown text-5xl rotate-12"></i>
            </div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter mb-1">{getTranslation('go_premium', lang)}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{getTranslation('unlock_all', lang)}</p>
            <button 
              onClick={onShowPremium}
              className="px-6 py-2.5 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20"
            >
              {getTranslation('buy_now', lang)}
            </button>
        </div>
      )}

      {/* Level Progress Bar */}
      <div className="glass-card rounded-2xl p-4 border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Level {level} Progress</span>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <StatCard label={getTranslation('total_xp', lang)} value={user.xp} icon="fa-bolt" color="text-yellow-400" />
         <StatCard label={getTranslation('streak', lang)} value={`${user.streak} ${getTranslation('days', lang)}`} icon="fa-fire" color="text-orange-500" />
         <StatCard label={getTranslation('learned', lang)} value={`${(user.learnedWords || []).length} ${getTranslation('words', lang)}`} icon="fa-brain" color="text-pink-400" />
         <StatCard label={getTranslation('wins', lang)} value={`${user.wins || 0} ${getTranslation('times', lang)}`} icon="fa-chart-line" color="text-green-400" />
      </div>

      {/* Gamification: Achievements Grid */}
      <UserBadges user={user} />

      {/* Activity Heatmap Section */}
      <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/5">
        <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-sm uppercase tracking-tighter">{getTranslation('activity_heatmap', lang)}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{getTranslation('last_90_days', lang)}</p>
            </div>
            <div className="flex items-center space-x-1">
               <span className="text-[8px] text-gray-500 uppercase font-black">{getTranslation('less', lang)}</span>
               <div className="w-2 h-2 rounded-sm bg-white/5"></div>
               <div className="w-2 h-2 rounded-sm bg-orange-900/50"></div>
               <div className="w-2 h-2 rounded-sm bg-orange-600/70"></div>
               <div className="w-2 h-2 rounded-sm bg-orange-500"></div>
               <span className="text-[8px] text-gray-500 uppercase font-black">{getTranslation('more', lang)}</span>
            </div>
        </div>
        
        <div className="overflow-x-auto pb-2 no-scrollbar">
           <ActivityHeatmap activityLog={user.activityLog || []} />
        </div>
        
        <div className="flex justify-between mt-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
            <span>{getTranslation('90_days_ago', lang)}</span>
            <span>{getTranslation('today', lang)}</span>
        </div>
      </div>
      
       <div className="glass-card rounded-2xl p-6 relative">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold">{getTranslation('interests', lang)}</h3>
             <button onClick={() => { setIsEditingInterests(true); setEditedInterests(user.interests); }} className="text-blue-400 text-sm font-bold">{getTranslation('edit', lang)}</button>
         </div>
         <div className="flex flex-wrap gap-2">
             {user.interests.map(i => (
                 <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs border border-white/5">{i}</span>
             ))}
         </div>
       </div>

       {/* Edit Interests Overlay */}
       {isEditingInterests && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
           <div className="glass-card w-full max-w-sm rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up">
             <h3 className="text-xl font-bold mb-4 text-center">{getTranslation('edit_interests', lang)}</h3>
             <p className="text-xs text-gray-400 mb-6 text-center">{getTranslation('min_max_interests', lang)}</p>
             
             <div className="flex flex-wrap gap-2 justify-center mb-8">
               {INTERESTS_OPTIONS.map(interest => (
                 <button
                   key={interest}
                   onClick={() => toggleInterest(interest)}
                   className={`px-4 py-2 rounded-full text-sm font-medium transition active:scale-95 ${editedInterests.includes(interest) ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/10 text-gray-400 border-white/5'} border`}
                 >
                   {interest}
                 </button>
               ))}
             </div>

             <div className="flex space-x-3">
               <button 
                 onClick={() => setIsEditingInterests(false)} 
                 className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-sm"
               >
                 {getTranslation('cancel', lang)}
               </button>
               <button 
                 onClick={handleSaveInterests} 
                 className="flex-1 py-3 rounded-xl liquid-button text-white font-bold text-sm"
               >
                 {getTranslation('save', lang)}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Secret Admin Trigger */}
       <div className="pt-10 pb-4 flex justify-center">
          <p 
            onClick={() => setShowLoginModal(true)}
            className="text-[10px] text-white/80 font-mono tracking-widest cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
          >
            date corp
          </p>
       </div>

       {/* Admin Login Modal */}
       {showLoginModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0f172a]/95 backdrop-blur-xl animate-fade-in">
            <div className="glass-card w-full max-w-xs p-8 rounded-[30px] border border-white/10 shadow-2xl animate-slide-up">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 border border-white/10">
                        <i className="fa-solid fa-lock text-white/70"></i>
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Admin Tizimi</h3>
                </div>

                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Login"
                        value={adminLogin}
                        onChange={(e) => setAdminLogin(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-center font-mono"
                    />
                    <input 
                        type="password" 
                        placeholder="Parol"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-center font-mono"
                    />
                    
                    {loginError && <p className="text-red-400 text-[10px] text-center font-bold">{loginError}</p>}

                    <div className="flex space-x-2 pt-2">
                        <button 
                            onClick={() => { setShowLoginModal(false); setLoginError(''); }}
                            className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition"
                        >
                            Bekor
                        </button>
                        <button 
                            onClick={handleAdminAuth}
                            className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition"
                        >
                            Kirish
                        </button>
                    </div>
                </div>
            </div>
         </div>
       )}

    </div>
  );
};

const ActivityHeatmap: React.FC<{ activityLog: string[] }> = ({ activityLog }) => {
    // Generate dates for the last 91 days (13 weeks)
    const heatmapData = useMemo(() => {
        const result = [];
        const today = new Date();
        // Set to midnight
        today.setHours(0, 0, 0, 0);

        for (let i = 90; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const isActive = activityLog.includes(dateStr);
            result.push({ dateStr, isActive, date });
        }
        return result;
    }, [activityLog]);

    // Group by weeks for the grid
    const weeks = useMemo(() => {
        const res = [];
        for (let i = 0; i < heatmapData.length; i += 7) {
            res.push(heatmapData.slice(i, i + 7));
        }
        return res;
    }, [heatmapData]);

    return (
        <div className="flex space-x-1.5 min-w-max">
            {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col space-y-1.5">
                    {week.map((day, dIdx) => (
                        <div 
                            key={day.dateStr}
                            className={`
                                w-3.5 h-3.5 rounded-[2px] transition-all duration-500
                                ${day.isActive 
                                    ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] scale-110' 
                                    : 'bg-white/5'}
                                ${day.date.toDateString() === new Date().toDateString() && !day.isActive 
                                    ? 'ring-1 ring-orange-500/50' 
                                    : ''}
                            `}
                            title={day.dateStr}
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    );
}

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

export default Profile;
