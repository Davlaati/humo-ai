import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const INTERESTS_OPTIONS = ['Technology', 'Business', 'Travel', 'Movies', 'Music', 'Sports', 'Gaming', 'Food', 'Fashion', 'Art', 'Science', 'History'];

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [editedInterests, setEditedInterests] = useState<string[]>(user.interests);

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
      alert("Kamida 3 ta qiziqishni tanlang!");
      return;
    }
    onUpdateUser({ ...user, interests: editedInterests });
    setIsEditingInterests(false);
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
         <p className="text-gray-400 font-medium">@{user.username || 'user'}</p>
         <div className="flex space-x-2 mt-2">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">{user.level}</span>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <StatCard label="Jami XP" value={user.xp} icon="fa-bolt" color="text-yellow-400" />
         <StatCard label="Streak" value={`${user.streak} kun`} icon="fa-fire" color="text-orange-500" />
         <StatCard label="O'rganildi" value={`${(user.learnedWords || []).length} so'z`} icon="fa-brain" color="text-pink-400" />
         <StatCard label="G'alaba" value={`${user.wins || 0} marta`} icon="fa-chart-line" color="text-green-400" />
      </div>

      {/* Activity Heatmap Section */}
      <div className="glass-card rounded-3xl p-6 shadow-xl border border-white/5">
        <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-sm uppercase tracking-tighter">Faollik Heatmap</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Oxirgi 90 kunlik natija</p>
            </div>
            <div className="flex items-center space-x-1">
               <span className="text-[8px] text-gray-500 uppercase font-black">Kam</span>
               <div className="w-2 h-2 rounded-sm bg-white/5"></div>
               <div className="w-2 h-2 rounded-sm bg-orange-900/50"></div>
               <div className="w-2 h-2 rounded-sm bg-orange-600/70"></div>
               <div className="w-2 h-2 rounded-sm bg-orange-500"></div>
               <span className="text-[8px] text-gray-500 uppercase font-black">Ko'p</span>
            </div>
        </div>
        
        <div className="overflow-x-auto pb-2 no-scrollbar">
           <ActivityHeatmap activityLog={user.activityLog || []} />
        </div>
        
        <div className="flex justify-between mt-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
            <span>90 kun avval</span>
            <span>Bugun</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
         <h3 className="font-bold mb-4">Yutuqlar</h3>
         <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            <Achievement icon="fa-shoe-prints" title="Ilk Qadam" earned={true} />
            <Achievement icon="fa-shield-cat" title="So'z Jangchisi" earned={user.xp > 100} />
            <Achievement icon="fa-graduation-cap" title="Vunderkind" earned={user.xp > 1000} />
            <Achievement icon="fa-stopwatch" title="Tezlik Ustasi" earned={(user.wins || 0) > 10} />
         </div>
      </div>
      
       <div className="glass-card rounded-2xl p-6 relative">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold">Qiziqishlar</h3>
             <button onClick={() => { setIsEditingInterests(true); setEditedInterests(user.interests); }} className="text-blue-400 text-sm font-bold">Tahrirlash</button>
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
             <h3 className="text-xl font-bold mb-4 text-center">Qiziqishlarni o'zgartirish</h3>
             <p className="text-xs text-gray-400 mb-6 text-center">Kamida 3 ta, ko'pi bilan 8 ta tanlang</p>
             
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
                 Bekor qilish
               </button>
               <button 
                 onClick={handleSaveInterests} 
                 className="flex-1 py-3 rounded-xl liquid-button text-white font-bold text-sm"
               >
                 Saqlash
               </button>
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

const Achievement: React.FC<{ icon: string; title: string; earned: boolean }> = ({ icon, title, earned }) => (
    <div className={`flex flex-col items-center min-w-[80px] space-y-2 group transition-all duration-300 ${earned ? 'opacity-100 scale-100' : 'opacity-30 grayscale scale-95'}`}>
        <div className={`w-16 h-16 rounded-2xl glass-panel flex items-center justify-center border-2 ${earned ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-white/5'}`}>
            <i className={`fa-solid ${icon} text-2xl ${earned ? 'text-purple-400' : 'text-gray-600'}`}></i>
        </div>
        <span className="text-[9px] font-black text-center uppercase tracking-tighter leading-tight">{title}</span>
    </div>
)

export default Profile;