
import React, { useState } from 'react';
import { UserProfile, Language, ThemeMode } from '../types';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');

  const updateSetting = (key: 'language' | 'theme', value: any) => {
    onUpdateUser({ ...user, settings: { ...user.settings, [key]: value } });
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center pt-10">
         <div className="relative">
             <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-600 p-1 shadow-2xl">
                 <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                     {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-4xl font-black">{user.name.charAt(0)}</span>}
                 </div>
             </div>
             <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 shadow-lg"></div>
         </div>
         <h2 className="text-2xl font-black mt-4">{user.name}</h2>
         <p className="text-blue-400 font-bold text-sm">@{user.username || 'humo_user'}</p>
      </div>

      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition ${activeTab === 'stats' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Statistika</button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Sozlamalar</button>
      </div>

      {activeTab === 'stats' ? (
        <div className="grid grid-cols-2 gap-4">
           <StatCard label="XP Balans" value={user.xp} icon="fa-bolt" color="text-yellow-400" />
           <StatCard label="HC Balans" value={user.coins} icon="fa-coins" color="text-yellow-500" />
           <StatCard label="G'alabalar" value={user.wins || 0} icon="fa-trophy" color="text-purple-400" />
           <StatCard label="Streak" value={`${user.streak} kun`} icon="fa-fire" color="text-orange-500" />
        </div>
      ) : (
        <div className="glass-card p-6 rounded-[32px] space-y-6">
            <div>
                <label className="text-[10px] uppercase text-gray-500 font-black mb-3 block">Ilova Tili</label>
                <div className="flex space-x-2">
                    {['Uz', 'Ru', 'Eng'].map(l => (
                        <button key={l} onClick={() => updateSetting('language', l)} className={`flex-1 py-3 rounded-xl font-bold text-xs border transition ${user.settings.language === l ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'border-white/10 text-gray-500'}`}>{l}</button>
                    ))}
                </div>
            </div>
            <div>
                <label className="text-[10px] uppercase text-gray-500 font-black mb-3 block">Mavzu</label>
                <div className="flex space-x-2">
                    <button onClick={() => updateSetting('theme', 'dark')} className={`flex-1 py-4 rounded-xl flex flex-col items-center border transition ${user.settings.theme === 'dark' ? 'bg-slate-800 border-blue-500 text-white' : 'border-white/10 text-gray-500'}`}>
                        <i className="fa-solid fa-moon mb-1"></i> <span className="text-[9px] font-black uppercase">Tun</span>
                    </button>
                    <button onClick={() => updateSetting('theme', 'light')} className={`flex-1 py-4 rounded-xl flex flex-col items-center border transition ${user.settings.theme === 'light' ? 'bg-white border-blue-500 text-slate-900 shadow-xl' : 'border-white/10 text-gray-500'}`}>
                        <i className="fa-solid fa-sun mb-1"></i> <span className="text-[9px] font-black uppercase">Kun</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
    <div className="glass-card p-5 rounded-3xl border border-white/5">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color} mb-3 shadow-inner`}><i className={`fa-solid ${icon} text-lg`}></i></div>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="font-black text-lg">{value}</p>
    </div>
);

export default Profile;
