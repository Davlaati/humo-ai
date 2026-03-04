
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTapSound } from '../services/audioService';

interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  durationMonths: number;
  isPopular?: boolean;
  isSuper?: boolean;
}

const PLANS: Plan[] = [
  { id: '1_month', name: '1 Oy', price: 36000, durationMonths: 1 },
  { id: '3_months', name: '3 Oy', price: 90000, originalPrice: 108000, durationMonths: 3 },
  { id: '6_months', name: '6 Oy', price: 150000, originalPrice: 216000, durationMonths: 6, isPopular: true },
  { id: '1_year', name: '1 Yil', price: 240000, originalPrice: 432000, durationMonths: 12, isSuper: true },
];

interface PricingProps {
  onSelectPlan: (plan: Plan) => void;
  onBack: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan, onBack }) => {
  const [showUpsell, setShowUpsell] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes

  useEffect(() => {
    if (showUpsell) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showUpsell]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelect = (plan: Plan) => {
    playTapSound();
    if (plan.id !== '1_year') {
      setPendingPlan(plan);
      setShowUpsell(true);
    } else {
      onSelectPlan(plan);
    }
  };

  const handleUpsellAccept = () => {
    playTapSound();
    const yearPlan = PLANS.find(p => p.id === '1_year')!;
    onSelectPlan({ ...yearPlan, name: '1 Yil + 1 Oy Sovg\'a', durationMonths: 13 });
  };

  const handleUpsellDecline = () => {
    playTapSound();
    if (pendingPlan) onSelectPlan(pendingPlan);
  };

  return (
    <div className="p-6 pb-32 min-h-full bg-[#0c1222] animate-fade-in overflow-y-auto no-scrollbar">
      <div className="flex items-center mb-10">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mr-4 border border-white/10 active:scale-90 transition">
          <i className="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Tarif Rejalari</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(plan)}
            className={`relative p-6 rounded-[35px] border-2 transition-all cursor-pointer overflow-hidden ${
              plan.isPopular 
                ? 'bg-blue-600/10 border-blue-500 shadow-[0_10px_30px_rgba(59,130,246,0.2)]' 
                : plan.isSuper
                ? 'bg-purple-600/10 border-purple-500 shadow-[0_10px_30px_rgba(168,85,247,0.2)]'
                : 'bg-white/5 border-white/10'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute top-4 right-4 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Eng Mashhur
              </div>
            )}
            {plan.isSuper && (
              <div className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Super Taklif
              </div>
            )}

            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic mb-1">{plan.name}</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-white">{plan.price.toLocaleString()} UZS</span>
                  {plan.originalPrice && (
                    <span className="text-sm text-slate-500 line-through font-bold">{plan.originalPrice.toLocaleString()} UZS</span>
                  )}
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plan.isPopular ? 'bg-blue-500' : plan.isSuper ? 'bg-purple-500' : 'bg-white/10'}`}>
                <i className="fa-solid fa-chevron-right text-white text-sm"></i>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Upsell Modal */}
      <AnimatePresence>
        {showUpsell && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[60px]"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
                  <i className="fa-solid fa-gift text-white text-3xl"></i>
                </div>

                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Shoshmang!</h2>
                <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-6">Maxsus Taklif</p>

                <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/5 w-full">
                  <p className="text-slate-300 text-sm font-bold leading-relaxed mb-4">
                    Hozir 1 yillik tarifni xarid qilsangiz, Ravona AI sizga yana <span className="text-purple-400 font-black">+1 OY BEPUL</span> qo'shib beradi! (Jami 13 oy)
                  </p>
                  <div className="text-red-500 font-black text-2xl animate-pulse">
                    {formatTime(countdown)}
                  </div>
                </div>

                <button 
                  onClick={handleUpsellAccept}
                  className="w-full py-5 bg-purple-600 text-white rounded-[25px] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all mb-4"
                >
                  1 yil + 1 oy sovg'ani olaman
                </button>

                <button 
                  onClick={handleUpsellDecline}
                  className="text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Yo'q, o'z tarifimda qolaman
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pricing;
