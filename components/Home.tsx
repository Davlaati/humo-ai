
import React, { useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { playTapSound } from '../services/audioService';
import DailyStreakCard from './DailyStreakCard';
import { validateAndUpdateStreak } from '../services/streakSystem';
import { checkAchievements } from '../services/achievementSystem';

interface HomeProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: UserProfile) => void;
  streakReward?: { days: number, coins: number } | null;
  onClearStreakReward?: () => void;
}

const Home: React.FC<HomeProps> = ({ user, onNavigate, onUpdateUser, streakReward, onClearStreakReward }) => {
  const prevStats = useRef({ xp: user.xp, wins: user.wins || 0 });

  // Initialize Gamification Logic
  useEffect(() => {
    const updatedUser = validateAndUpdateStreak(user);
    const badgeUpdates = checkAchievements(updatedUser);
    
    if (updatedUser.streak !== user.streak || badgeUpdates.length !== ((user as any).badges?.length || 0)) {
      onUpdateUser({
        ...updatedUser,
        badges: badgeUpdates
      } as any);
    }
  }, []);

  useEffect(() => {
    const xpGained = user.xp > prevStats.current.xp;
    const winGained = (user.wins || 0) > prevStats.current.wins;

    if (xpGained || winGained) {
      playTapSound();
    }

    prevStats.current = { xp: user.xp, wins: user.wins || 0 };
  }, [user.xp, user.wins]);

  const handleAction = (tab: string | (() => void)) => {
    playTapSound();
    if (typeof tab === 'string') onNavigate(tab);
    else tab();
  };

  const handlePlaceholder = (feature: string) => {
    playTapSound();
    alert(`${feature} tez kunda ishga tushadi!`);
  };

  return (
    <div className="p-5 pb-40 space-y-8 animate-slide-up overflow-x-hidden">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center pt-2 mb-2">
        <div className="flex flex-col">
           <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Xush kelibsiz</span>
           <h1 className="text-2xl font-black text-white leading-none">Salom, {user.name.split(' ')[0]}</h1>
        </div>

        <div onClick={() => onNavigate('wallet')} className="bg-white/5 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center space-x-2 border border-white/10 shadow-lg active:scale-95 transition-transform cursor-pointer">
           <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-coins text-yellow-400 text-xs"></i>
           </div>
           <span className="font-black text-white text-sm">{user.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* 2. STREAK MENU */}
      <div className="-mx-4">
        <DailyStreakCard user={user} />
      </div>

      {/* 3. MAIN APPS GRID (Liquid Glass Style) */}
      <div className="space-y-4">
         <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-1">Ilovalar</h2>
         
         <div className="grid grid-cols-2 gap-3">
            
            {/* Darslar (Full Width) */}
            <div 
              onClick={() => handleAction('learn')}
              className="col-span-2 glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-[35px] p-6 relative min-h-[12rem] h-auto overflow-visible group active:scale-[0.98] transition-all shadow-[0_10px_40px_rgba(0,0,0,0.2)] cursor-pointer"
            >
                <div className="relative z-10 w-2/3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 border border-blue-500/30">
                        <i className="fa-solid fa-book-open text-blue-400"></i>
                    </div>
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-1">Darslar</h3>
                    <p className="text-slate-400 text-xs font-bold leading-tight">Yangi mavzular va interaktiv mashqlar</p>
                    <div className="mt-4 bg-white/10 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase backdrop-blur-sm border border-white/5 group-hover:bg-blue-500 group-hover:text-white transition-colors">Boshlash</div>
                </div>
                <div className="absolute -right-6 -top-8 w-44 h-44 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-105 group-hover:-translate-y-2 duration-300 pointer-events-none">
                    <div className="w-full h-full flex items-center justify-center text-[110px] transform -rotate-12">
                        📚
                    </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-[35px]"></div>
            </div>

            {/* Speaking (Half) */}
            <div 
              onClick={() => handleAction('speaking-club')}
              className="col-span-1 glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-[35px] p-5 relative h-40 overflow-visible group active:scale-[0.98] transition-all shadow-lg cursor-pointer"
            >
                <div className="relative z-10 mt-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mb-2 border border-purple-500/30">
                        <i className="fa-solid fa-headset text-purple-400 text-xs"></i>
                    </div>
                    <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">Speaking</h3>
                    <p className="text-slate-500 text-[9px] font-bold">AI Mentor</p>
                </div>
                <div className="absolute -right-3 -top-5 w-28 h-28 filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform pointer-events-none">
                     <div className="w-full h-full flex items-center justify-center text-[75px] transform rotate-6">
                        🎧
                    </div>
                </div>
            </div>

            {/* Lug'at (Half) */}
            <div 
              onClick={() => handleAction('dictionary')}
              className="col-span-1 glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-[35px] p-5 relative h-40 overflow-visible group active:scale-[0.98] transition-all shadow-lg cursor-pointer"
            >
                <div className="relative z-10 mt-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 border border-emerald-500/30">
                        <i className="fa-solid fa-book-journal-whills text-emerald-400 text-xs"></i>
                    </div>
                    <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">Lug'at</h3>
                    <p className="text-slate-500 text-[9px] font-bold">Smart Mentor</p>
                </div>
                <div className="absolute -right-3 -top-5 w-28 h-28 filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform pointer-events-none">
                     <div className="w-full h-full flex items-center justify-center text-[75px] transform -rotate-6">
                        📖
                    </div>
                </div>
            </div>

            {/* O'yin (Half) */}
            <div 
              onClick={() => handleAction('game')}
              className="col-span-1 glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-[35px] p-5 relative h-36 overflow-visible group active:scale-[0.98] transition-all shadow-lg cursor-pointer"
            >
                <div className="relative z-10 mt-2">
                    <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">O'yin</h3>
                    <p className="text-slate-500 text-[9px] font-bold">PvP Battle</p>
                </div>
                <div className="absolute -right-2 -top-4 w-24 h-24 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform pointer-events-none">
                     <div className="w-full h-full flex items-center justify-center text-[65px] transform rotate-12">
                        🎮
                    </div>
                </div>
            </div>

            {/* Top Rating (Half) */}
            <div 
              onClick={() => handleAction('leaderboard')}
              className="col-span-1 glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-[35px] p-5 relative h-36 overflow-visible group active:scale-[0.98] transition-all shadow-lg cursor-pointer"
            >
                <div className="relative z-10 mt-2">
                    <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">Top Rating</h3>
                    <p className="text-slate-500 text-[9px] font-bold">Leaderboard</p>
                </div>
                <div className="absolute -right-2 -top-4 w-24 h-24 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform pointer-events-none">
                     <div className="w-full h-full flex items-center justify-center text-[65px] transform -rotate-12">
                        🏆
                    </div>
                </div>
            </div>

            {/* Market (Full Width) */}
            <div 
              onClick={() => handlePlaceholder('Marketplace')}
              className="col-span-2 glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-[35px] p-5 relative h-28 overflow-visible group active:scale-[0.98] transition-all shadow-lg cursor-pointer"
            >
                <div className="absolute top-3 right-3 bg-white/10 px-2 py-0.5 rounded text-[8px] font-black text-slate-300 uppercase border border-white/5 z-20">Tez Kunda</div>
                <div className="flex items-center space-x-4 relative z-10 h-full">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                        <i className="fa-solid fa-shop text-orange-400"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">Market</h3>
                        <p className="text-slate-500 text-[9px] font-bold">Shop & Items</p>
                    </div>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-20 grayscale pointer-events-none transform rotate-12">
                    🛒
                </div>
            </div>

         </div>
      </div>

      {/* 4. FOYDALI BO'LIMLAR */}
      <div className="pt-4">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-1 mb-4 flex items-center">
             Foydali Xizmatlar 
             <div className="h-px bg-white/10 flex-1 ml-4"></div>
          </h2>
          
          <div className="space-y-4">
              {/* Wallet Banner */}
              <LargeBannerItem 
                  title="Hamyon & Premium" 
                  subtitle="Balansni to'ldirish va almashtirish"
                  icon="fa-wallet"
                  color="text-green-400"
                  bgColor="bg-green-500/20"
                  onClick={() => handleAction('wallet')}
                  bgEmoji="💰"
              />

              {/* Translator Banner */}
              <LargeBannerItem 
                  title="AI Tarjimon" 
                  subtitle="Matnlarni professional darajada tarjima qiling"
                  icon="fa-language"
                  color="text-blue-400"
                  bgColor="bg-blue-500/20"
                  onClick={() => handleAction('translator')}
                  bgEmoji="🌐"
              />
          </div>
      </div>
    </div>
  );
};

interface LargeBannerItemProps {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    bgColor: string;
    onClick: () => void;
    bgEmoji: string;
    isComingSoon?: boolean;
}

const LargeBannerItem: React.FC<LargeBannerItemProps> = ({ title, subtitle, icon, color, bgColor, onClick, bgEmoji, isComingSoon }) => (
    <div 
        onClick={onClick}
        className="glass-card rounded-[30px] p-1 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer h-28 border border-white/5 shadow-md"
    >
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50"></div>
        
        {isComingSoon && (
            <div className="absolute top-3 right-3 bg-white/10 px-2 py-0.5 rounded text-[8px] font-black text-slate-300 uppercase border border-white/5 z-20">Tez Kunda</div>
        )}
        
        <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-[28px] p-5 h-full flex items-center justify-between relative z-10 border border-white/5">
            <div className="flex items-center space-x-5">
                <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center shadow-lg border border-white/5`}>
                    <i className={`fa-solid ${icon} ${color} text-2xl`}></i>
                </div>
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none mb-1.5">{title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold max-w-[150px] leading-tight">{subtitle}</p>
                </div>
            </div>
            
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                <i className="fa-solid fa-arrow-right -rotate-45 text-slate-400 text-sm"></i>
            </div>
        </div>

        <div className="absolute right-[-10px] top-[-10px] text-8xl opacity-5 grayscale pointer-events-none transform rotate-12 filter blur-[1px]">
            {bgEmoji}
        </div>
    </div>
);

export default Home;
