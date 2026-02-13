import React, { useState } from 'react';
import { UserProfile } from '../types';
import { convertHumoToStars, purchaseStars } from '../services/storageService';
import { playTapSound } from '../services/audioService';

interface WalletProps {
  user: UserProfile;
}

const STAR_VARIANTS = [50, 75, 100, 150, 250, 350, 500, 750, 1000, 1500, 2500];
const CONVERSION_RATE = 10;

const Wallet: React.FC<WalletProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'humo' | 'stars'>('humo');
  const [confirmModal, setConfirmModal] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConvert = (amount: number) => {
    playTapSound();
    setConfirmModal(amount);
  };

  const executeConversion = () => {
    if (confirmModal === null) return;
    setIsProcessing(true);
    
    // Simulate API Delay
    setTimeout(() => {
      const updatedUser = convertHumoToStars(confirmModal);
      if (updatedUser) {
        window.location.reload(); // Force refresh to sync state
      } else {
        alert("Humo Coin yetarli emas!");
      }
      setIsProcessing(false);
      setConfirmModal(null);
    }, 1000);
  };

  const simulateStarsPurchase = (amount: number) => {
    playTapSound();
    // Simulate Telegram openInvoice
    setIsProcessing(true);
    setTimeout(() => {
      purchaseStars(amount);
      window.location.reload();
    }, 1500);
  };

  const starsHistory = user.starsHistory || [];

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Balances Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-3xl bg-gradient-to-br from-yellow-600/20 to-orange-600/10 border border-yellow-500/20 shadow-xl">
           <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest mb-1">Humo Coins</p>
           <h1 className="text-3xl font-black text-white">{user.coins} <span className="text-sm opacity-50">HC</span></h1>
           <i className="fa-solid fa-coins text-2xl text-yellow-500 mt-2 opacity-30"></i>
        </div>
        <div className="glass-card p-5 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 shadow-xl">
           <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Telegram Stars</p>
           <h1 className="text-3xl font-black text-white">{user.telegramStars || 0} <span className="text-sm opacity-50">XTR</span></h1>
           <i className="fa-solid fa-star text-2xl text-blue-500 mt-2 opacity-30"></i>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
         <button 
           onClick={() => setActiveTab('humo')}
           className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'humo' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
         >
           Humo Exchange
         </button>
         <button 
           onClick={() => setActiveTab('stars')}
           className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'stars' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
         >
           Stars Shop
         </button>
      </div>

      {activeTab === 'humo' ? (
        <div className="space-y-4 animate-slide-up">
          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <h3 className="font-bold text-sm mb-1">Konvertatsiya</h3>
            <p className="text-xs text-gray-400">1 Star = {CONVERSION_RATE} Humo Coin</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
             {STAR_VARIANTS.map(stars => (
               <button 
                 key={stars}
                 onClick={() => handleConvert(stars)}
                 className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center space-y-1 active:scale-95 transition-all border border-white/5 hover:border-yellow-500/30"
               >
                 <span className="text-lg font-black text-white">{stars}</span>
                 <span className="text-[9px] text-yellow-500 font-bold uppercase">-{stars * CONVERSION_RATE} HC</span>
               </button>
             ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-slide-up">
           <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 bg-blue-500/5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                 <i className="fa-solid fa-star text-8xl"></i>
              </div>
              <h3 className="text-lg font-bold mb-2">Buy Telegram Stars</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Sotib olingan Stars orqali Humo AI ning barcha premium funksiyalaridan foydalana olasiz.</p>
           </div>

           <div className="grid grid-cols-2 gap-3">
              {[50, 100, 250, 500].map(amount => (
                <button 
                  key={amount}
                  onClick={() => simulateStarsPurchase(amount)}
                  className="glass-card p-5 rounded-2xl flex flex-col items-center border border-white/10 active:scale-95 transition-all hover:bg-blue-500/10 group"
                >
                   <i className="fa-solid fa-star text-blue-400 mb-2 text-xl group-hover:rotate-12 transition-transform"></i>
                   <span className="text-xl font-black text-white">{amount} XTR</span>
                   <span className="text-[10px] text-gray-500 font-bold mt-1">Sotib olish</span>
                </button>
              ))}
           </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="pt-4 border-t border-white/5">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Tranzaksiyalar tarixi</h3>
        <div className="space-y-3">
          {starsHistory.length > 0 ? (
            starsHistory.map(tx => (
              <div key={tx.id} className="glass-panel p-4 rounded-2xl flex justify-between items-center border border-white/5">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'conversion' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    <i className={`fa-solid ${tx.type === 'conversion' ? 'fa-shuffle' : 'fa-star'}`}></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tighter">{tx.type.replace('_', ' ')}</p>
                    <p className="text-[10px] text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-white">+{tx.amount} XTR</p>
                  {tx.costInHumo && <p className="text-[9px] text-red-400">-{tx.costInHumo} HC</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 text-xs py-10">Tarix hali mavjud emas.</p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
           <div className="glass-card w-full max-w-sm rounded-3xl p-8 border border-white/20 shadow-2xl animate-slide-up text-center">
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <i className="fa-solid fa-shuffle text-3xl text-yellow-500"></i>
              </div>
              <h2 className="text-2xl font-black mb-2">Ishonchingiz komilmi?</h2>
              <p className="text-gray-400 text-sm mb-8">
                <span className="text-white font-bold">{confirmModal * CONVERSION_RATE} Humo Coin</span> evaziga 
                <span className="text-yellow-400 font-bold"> {confirmModal} Telegram Stars</span> olasiz.
              </p>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  disabled={isProcessing}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-400 font-bold text-sm active:scale-95 transition"
                >
                  Yo'q
                </button>
                <button 
                  onClick={executeConversion}
                  disabled={isProcessing}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm active:scale-95 transition shadow-lg shadow-blue-500/30 flex items-center justify-center"
                >
                  {isProcessing ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : 'Ha, Almashtirish'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;