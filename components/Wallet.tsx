import React from 'react';
import { UserProfile } from '../types';
import { isPremiumActive } from '../services/storageService';
import { ArrowLeft, Wallet as WalletIcon, Crown, Zap, Coins, Clock, ChevronRight } from 'lucide-react';
import { playTapSound } from '../services/audioService';
import GrowthTasks from './GrowthTasks';

interface WalletProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onNavigate: (tab: string) => void;
}

const Wallet: React.FC<WalletProps> = ({ user, onUpdateUser, onNavigate }) => {
  const isPremium = isPremiumActive(user);
  
  const getDaysRemaining = () => {
    if (!user.premiumUntil) return 0;
    const expiry = new Date(user.premiumUntil).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="h-full w-full bg-[#0c1222] flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
        <button 
          onClick={() => { playTapSound(); onNavigate('home'); }}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Hamyon</h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        <div className="flex flex-col items-center mb-10 pt-4">
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10 mb-4 shadow-2xl shadow-blue-500/20 rotate-3">
            <WalletIcon className="w-12 h-12 text-white" />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Sizning hisobingiz</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-6 rounded-[32px] bg-slate-800/40 border border-white/5 flex flex-col items-center text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-3 border border-yellow-500/20">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-2xl font-black text-white tracking-tighter">{(user.coins || 0).toLocaleString()}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Ravona Coins</p>
          </div>
          <div className="glass-card p-6 rounded-[32px] bg-slate-800/40 border border-white/5 flex flex-col items-center text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 border border-blue-500/20">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white tracking-tighter">{(user.xp || 0).toLocaleString()}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Tajriba (XP)</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[40px] bg-gradient-to-br from-blue-600/20 via-slate-900/40 to-transparent border border-blue-500/30 relative overflow-hidden mb-8 shadow-2xl">
          <div className="absolute -top-4 -right-4 opacity-10">
            <Crown className="w-32 h-32 text-blue-400 rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Premium Status</h3>
            </div>
            
            <p className="text-xs text-slate-400 mb-8 max-w-[220px] leading-relaxed font-medium">
              Barcha imkoniyatlarni oching, reklamalarni o'chiring va <span className="text-blue-400 font-bold">2x XP</span> multiplikatoriga ega bo'ling.
            </p>
            
            {isPremium ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Qolgan vaqt</p>
                    <p className="text-lg font-black text-green-400 tracking-tighter">{daysRemaining} KUN</p>
                  </div>
                </div>
                <button 
                  onClick={() => { playTapSound(); onNavigate('pricing'); }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Muddatini uzaytirish <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { playTapSound(); onNavigate('pricing'); }}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Premiumga o'tish <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-800/20 rounded-[40px] border border-white/5 shadow-xl mb-8">
          <GrowthTasks user={user} onUpdateUser={onUpdateUser} />
        </div>

        <div className="p-8 bg-slate-800/20 rounded-[40px] border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">So'nggi Amallar</h4>
            <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Hammasi</button>
          </div>
          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <i className="fa-solid fa-receipt text-4xl mb-4"></i>
            <p className="text-xs font-bold italic">Hozircha amallar mavjud emas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
