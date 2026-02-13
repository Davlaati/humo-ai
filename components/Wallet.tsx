
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { convertHumoToStars } from '../services/storageService';
import { playTapSound } from '../services/audioService';

interface WalletProps {
  user: UserProfile;
}

const STAR_VARIANTS = [
  { stars: 50, cost: 500 },
  { stars: 100, cost: 1000 },
  { stars: 250, cost: 2500 },
  { stars: 500, cost: 5000 },
  { stars: 1000, cost: 10000 },
  { stars: 2500, cost: 25000 },
];

const Wallet: React.FC<WalletProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'humo' | 'stars'>('humo');
  const [confirmModal, setConfirmModal] = useState<typeof STAR_VARIANTS[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConvertClick = (variant: typeof STAR_VARIANTS[0]) => {
    playTapSound();
    setConfirmModal(variant);
  };

  const executeConversion = () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      const updatedUser = convertHumoToStars(confirmModal.stars);
      if (updatedUser) {
        window.location.reload(); 
      } else {
        alert("HC yetarli emas!");
      }
      setIsProcessing(false);
      setConfirmModal(null);
    }, 1200);
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar relative">
      {/* Balances Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[32px] bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/30 shadow-[0_10px_30px_rgba(234,179,8,0.1)]">
           <div className="flex items-center space-x-2 mb-1">
              <i className="fa-solid fa-coins text-yellow-400 text-xs"></i>
              <p className="text-[10px] text-yellow-400 font-black uppercase tracking-[0.2em]">Humo Coins</p>
           </div>
           <h1 className="text-3xl font-black text-white">{user.coins.toLocaleString()}</h1>
           <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">O'yin ichidagi valyuta</p>
        </div>
        <div className="glass-card p-5 rounded-[32px] bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30 shadow-[0_10px_30px_rgba(59,130,246,0.1)]">
           <div className="flex items-center space-x-2 mb-1">
              <i className="fa-solid fa-star text-blue-400 text-xs"></i>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">TG Stars</p>
           </div>
           <h1 className="text-3xl font-black text-white">{user.telegramStars.toLocaleString()}</h1>
           <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Real platform valyutasi</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-panel p-6 rounded-[40px] border border-white/5 bg-slate-800/20 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">Humo Birjasi</h2>
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Kurs: 10 HC = 1 XTR</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {STAR_VARIANTS.map(v => (
               <button 
                 key={v.stars}
                 onClick={() => handleConvertClick(v)}
                 className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center space-y-2 active:scale-95 transition-all border border-white/5 hover:border-yellow-500/30 group bg-slate-900/40"
               >
                 <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-star text-yellow-500 text-xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"></i>
                 </div>
                 <span className="text-xl font-black text-white">{v.stars} XTR</span>
                 <div className="flex items-center space-x-1.5 opacity-60">
                    <i className="fa-solid fa-coins text-[10px] text-yellow-500"></i>
                    <span className="text-[11px] font-black text-slate-300">-{v.cost} HC</span>
                 </div>
               </button>
             ))}
          </div>
      </div>

      {/* History */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Amaliyotlar tarixi</h3>
        <div className="space-y-3">
          {(user.starsHistory || []).map(tx => (
            <div key={tx.id} className="glass-card p-4 rounded-3xl flex items-center justify-between border border-white/5 bg-slate-900/20">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <i className="fa-solid fa-arrow-right-arrow-left text-blue-400 text-sm"></i>
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tighter">{"Humo -> Stars"}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{new Date(tx.timestamp).toLocaleDateString('uz-UZ')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-green-400">+{tx.amount} XTR</p>
                <p className="text-[9px] text-slate-500 font-bold">-{tx.costInHumo} HC</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Overlay */}
      {confirmModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-[#0c1222]/90 backdrop-blur-xl animate-fade-in">
           <div className="glass-card w-full max-w-sm rounded-[45px] p-8 border border-white/20 shadow-2xl animate-slide-up text-center bg-slate-900">
              <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                 <i className="fa-solid fa-shuffle text-4xl text-yellow-500 animate-pulse"></i>
              </div>
              <h2 className="text-2xl font-black mb-3 italic tracking-tighter">ALMASHTIRISHNI TASDIQLANG</h2>
              <p className="text-slate-400 text-sm mb-10 leading-relaxed px-4">
                Sizning balansingizdan <span className="text-white font-black underline">{confirmModal.cost} HC</span> yechiladi va evaziga <span className="text-blue-400 font-black">{confirmModal.stars} Telegram Stars</span> olasiz.
              </p>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  disabled={isProcessing}
                  className="flex-1 py-5 rounded-[25px] bg-white/5 text-slate-500 font-black text-xs uppercase tracking-widest active:scale-95 transition"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={executeConversion}
                  disabled={isProcessing}
                  className="flex-1 py-5 rounded-[25px] liquid-button text-white font-black text-xs uppercase tracking-widest active:scale-95 transition shadow-xl shadow-blue-500/30 flex items-center justify-center"
                >
                  {isProcessing ? <i className="fa-solid fa-circle-notch animate-spin text-lg"></i> : 'TASDIQLASH'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
