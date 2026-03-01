import React, { useState } from 'react';
import { UserProfile } from '../types';
import { convertRavonaToStars, saveUser } from '../services/storageService';
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
  const [premiumStep, setPremiumStep] = useState<0 | 1 | 2>(0); // 0: Benefits, 1: Plan, 2: Confirm Modal

  const handleBuyPremium = () => {
    playTapSound();
    
    const tg = (window as any).Telegram?.WebApp;
    const mockInvoiceLink = "https://t.me/$..."; 

    if (tg && tg.initData) {
        if (mockInvoiceLink === "https://t.me/$...") {
             const updatedUser = { ...user, isPremium: true };
             saveUser(updatedUser);
             window.location.reload();
             return;
        }

        tg.openInvoice(mockInvoiceLink, (status: string) => {
            if (status === 'paid') {
                tg.showPopup({
                    title: 'Tabriklaymiz!',
                    message: "Siz Premium statusini muvaffaqiyatli sotib oldingiz!",
                    buttons: [{type: 'ok'}]
                });
                const updatedUser = { ...user, isPremium: true };
                saveUser(updatedUser);
                window.location.reload();
            } else if (status === 'failed') {
                tg.showPopup({ title: 'Xatolik', message: "To'lov amalga oshmadi." });
            }
        });
    } else {
        const updatedUser = { ...user, isPremium: true };
        saveUser(updatedUser);
        window.location.reload();
    }
  };

  const renderPremiumBenefits = () => (
    <div className="flex flex-col animate-fade-in overflow-y-auto no-scrollbar pb-24 h-full">
      <div className="relative p-6 flex flex-col items-center">
        {/* Header Section */}
        <div className="w-full mb-8 text-center pt-10">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Ravona Premium</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Barcha imkoniyatlarni oching</p>
        </div>

        {/* 2x XP Card */}
        <div className="w-full glass-card rounded-[32px] p-6 bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white italic tracking-tighter">2x XP Multiplikator</h3>
            <p className="text-yellow-500/70 text-[10px] font-black uppercase tracking-widest mt-1">Tezroq daraja oshiring</p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <i className="fa-solid fa-bolt text-yellow-500 text-5xl drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse"></i>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-10">
          {[
            { title: "Cheksiz Speaking vaqt", icon: "fa-hourglass-half", color: "text-blue-400", bgColor: "bg-blue-500/10" },
            { title: "Reklamasiz tajriba", icon: "fa-eye-slash", color: "text-red-400", bgColor: "bg-red-500/10" },
            { title: "O'zingizni jangda sinang", icon: "fa-shield-halved", color: "text-slate-400", bgColor: "bg-slate-500/10" },
            { title: "Suniy intelekt bilan organing", icon: "fa-wand-magic-sparkles", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
            { title: "O'z faoliyatingizni kuzatib boring", icon: "fa-chart-line", color: "text-blue-500", bgColor: "bg-blue-500/10" },
            { title: "Aqli lug'at bilan o'rganing", icon: "fa-book-open-reader", color: "text-purple-400", bgColor: "bg-purple-500/10" }
          ].map((benefit, i) => (
            <div key={i} className="glass-card p-5 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl ${benefit.bgColor} flex items-center justify-center border border-white/5`}>
                <i className={`fa-solid ${benefit.icon} ${benefit.color} text-xl`}></i>
              </div>
              <p className="text-[10px] font-black text-white leading-tight uppercase tracking-tighter">{benefit.title}</p>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <i className="fa-brands fa-telegram text-blue-400 text-xl"></i>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">telegram payment orqali to'lov</p>
          </div>
        </div>

        {/* Subscribe Button */}
        <button 
          onClick={() => setPremiumStep(1)}
          className="w-full py-5 liquid-button rounded-[28px] font-black text-white uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-sm"
        >
          hoziroq obuna bo'lish
        </button>
      </div>
    </div>
  );

  const renderPlanSelection = () => (
    <div className="flex flex-col animate-fade-in overflow-y-auto no-scrollbar pb-10 min-h-full">
      <div className="relative p-6 flex flex-col items-center">
        <button 
          onClick={() => setPremiumStep(0)}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>

        <div className="w-full mb-10 text-center pt-10">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Rejani tanlang</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Siz uchun eng ma'qulini tanlang</p>
        </div>

        <div className="w-full glass-card rounded-[40px] p-8 bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30 mb-10 relative">
          <div className="absolute -top-3 right-6 bg-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center shadow-lg">
            <i className="fa-solid fa-fire mr-1.5 text-[10px]"></i>
            eng yaxshi taklif
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-white italic">Oylik Obuna</h3>
            <div className="flex items-center space-x-1">
              <i className="fa-solid fa-star text-yellow-500 text-sm"></i>
              <i className="fa-solid fa-star text-yellow-500 text-sm"></i>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">
            Ravona AI Premium bu oddiy AI emas, balki real ishlatadiganlar uchun mo'ljallangan kengaytirilgan imkoniyatlar to'plami.
          </p>

          <div className="flex items-end space-x-3 mb-2">
            <h4 className="text-4xl font-black text-white">36 444/oy</h4>
            <div className="bg-blue-500/20 px-3 py-1 rounded-xl text-[10px] font-black text-blue-400 mb-1 border border-blue-500/20">231 stars</div>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">3$ USD</p>
        </div>

        <div className="flex flex-col items-center mb-10 space-y-4">
           <div className="flex items-center space-x-4 opacity-50 grayscale">
              <i className="fa-brands fa-cc-visa text-3xl"></i>
              <i className="fa-brands fa-cc-mastercard text-3xl"></i>
              <i className="fa-brands fa-cc-apple-pay text-3xl"></i>
           </div>
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Barcha to'lov turlari mavjud</p>
        </div>

        <button 
          onClick={() => setPremiumStep(2)}
          className="w-full py-5 liquid-button rounded-[28px] font-black text-white uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-sm"
        >
          hoziroq sotib olish
        </button>
      </div>
    </div>
  );

  const renderConfirmModal = () => (
    <div className="fixed inset-0 z-[6000] flex items-end justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-card rounded-[45px] p-8 border border-white/10 shadow-2xl animate-slide-up bg-[#0f172a] relative">
        <button 
          onClick={() => setPremiumStep(1)}
          className="absolute top-8 left-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-24 h-24 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
             <i className="fa-solid fa-gem text-4xl text-blue-500"></i>
          </div>
          
          <div className="bg-blue-500/20 px-4 py-1.5 rounded-full text-[10px] font-black text-blue-400 mb-6 border border-blue-500/30">3$ USD</div>
          
          <h2 className="text-2xl font-black text-white italic tracking-tighter mb-3 uppercase">Xaridingizni tasdiqlang</h2>
          
          <div className="flex items-center space-x-2 mb-8 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <i className="fa-solid fa-check text-[10px] text-white"></i>
            </div>
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-wider">Ravona AI - Smart App</p>
          </div>

          <p className="text-sm font-medium text-slate-400 mb-10 leading-relaxed">
            Ravona AI Premium obunasini <span className="text-white font-bold">3$</span> evaziga faollashtirishni xohlaysizmi?
          </p>

          <button 
            onClick={handleBuyPremium}
            className="w-full py-5 liquid-button rounded-[28px] font-black text-white text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all mb-6"
          >
            Tasdiqlash va to'lash
          </button>

          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
            xarid qilish orqali siz <br/> <span className="text-slate-500 underline">xizmat shartlariga</span> rozilik bildirasiz
          </p>
        </div>
      </div>
    </div>
  );

  const renderPremiumActive = () => (
    <div className="flex flex-col items-center justify-center min-h-full p-6 animate-fade-in text-center">
        <div className="w-32 h-32 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30 mb-8 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
            <i className="fa-solid fa-crown text-6xl text-yellow-500 animate-bounce"></i>
        </div>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">SIZ PREMIUMSIZ!</h2>
        <div className="bg-yellow-500/20 px-4 py-1.5 rounded-full border border-yellow-500/30 mb-8">
            <p className="text-xs font-black text-yellow-500 uppercase tracking-widest">Barcha imkoniyatlar ochiq</p>
        </div>
        
        <div className="w-full glass-card rounded-[35px] p-6 border border-white/10 bg-white/5 space-y-4 text-left">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <i className="fa-solid fa-check text-green-400"></i>
                </div>
                <p className="text-sm font-bold text-slate-300">2x XP Multiplikator faol</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <i className="fa-solid fa-check text-blue-400"></i>
                </div>
                <p className="text-sm font-bold text-slate-300">Cheksiz Speaking vaqti</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <i className="fa-solid fa-check text-purple-400"></i>
                </div>
                <p className="text-sm font-bold text-slate-300">Reklamasiz interfeys</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#0c1222] relative overflow-hidden">
      {user.isPremium ? (
          renderPremiumActive()
      ) : (
          <>
            {premiumStep === 0 && renderPremiumBenefits()}
            {premiumStep === 1 && renderPlanSelection()}
            {premiumStep === 2 && renderConfirmModal()}
          </>
      )}
    </div>
  );
};

export default Wallet;
