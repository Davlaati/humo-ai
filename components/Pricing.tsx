
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playTapSound } from '../services/audioService';
import UpsellModal from './UpsellModal';

interface PricingProps {
  onSelectPlan: (plan: any) => void;
  onBack: () => void;
  isBlocked?: boolean;
}

const PLANS = [
  {
    id: '1_month',
    name: '1 Oy',
    price: 36000,
    originalPrice: null,
    duration: 1,
    label: 'Standart',
    color: 'from-slate-700 to-slate-900',
    icon: 'fa-bolt'
  },
  {
    id: '3_months',
    name: '3 Oy',
    price: 90000,
    originalPrice: 108000,
    duration: 3,
    label: 'Tejamkor',
    color: 'from-blue-700 to-blue-900',
    icon: 'fa-rocket'
  },
  {
    id: '6_months',
    name: '6 Oy',
    price: 150000,
    originalPrice: 216000,
    duration: 6,
    label: 'Eng mashhur',
    highlight: true,
    color: 'from-purple-700 to-purple-900',
    icon: 'fa-fire'
  },
  {
    id: '1_year',
    name: '1 Yil',
    price: 240000,
    originalPrice: 432000,
    duration: 12,
    label: 'Super Taklif',
    color: 'from-emerald-700 to-emerald-900',
    icon: 'fa-gem'
  }
];

const Pricing: React.FC<PricingProps> = ({ onSelectPlan, onBack, isBlocked }) => {
  const [showUpsell, setShowUpsell] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);

  const handleSelect = (plan: any) => {
    playTapSound();
    if (plan.id !== '1_year') {
      setPendingPlan(plan);
      setShowUpsell(true);
    } else {
      onSelectPlan(plan);
    }
  };

  const handleUpsellAccept = () => {
    const yearPlan = PLANS.find(p => p.id === '1_year');
    onSelectPlan({ ...yearPlan, bonusMonth: true });
  };

  const handleUpsellReject = () => {
    onSelectPlan(pendingPlan);
  };

  return (
    <div className="min-h-full bg-[#0c1222] p-6 pb-32 overflow-y-auto no-scrollbar animate-fade-in">
      <div className="flex items-center mb-8">
        {!isBlocked && (
          <button onClick={onBack} className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mr-4 border border-white/10 active:scale-90 transition">
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
        )}
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Tarif Rejalari</h1>
      </div>

      <div className="text-center mb-10">
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
          Premium bilan barcha imkoniyatlarni oching
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(plan)}
            className={`relative glass-card rounded-[35px] p-6 border-2 overflow-hidden cursor-pointer transition-all ${
              plan.highlight ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'border-white/5'
            }`}
          >
            {plan.highlight && (
              <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10">
                {plan.label}
              </div>
            )}
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                  <i className={`fa-solid ${plan.icon} text-white text-2xl`}></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">{plan.name}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{!plan.highlight ? plan.label : 'Premium Access'}</p>
                </div>
              </div>
              
              <div className="text-right">
                {plan.originalPrice && (
                  <p className="text-slate-500 text-xs font-bold line-through mb-1">
                    {plan.originalPrice.toLocaleString()} UZS
                  </p>
                )}
                <p className="text-xl font-black text-white">
                  {plan.price.toLocaleString()} <span className="text-xs">UZS</span>
                </p>
              </div>
            </div>

            {/* Background Decoration */}
            <div className={`absolute -right-4 -bottom-4 text-6xl opacity-5 transform rotate-12`}>
              <i className={`fa-solid ${plan.icon}`}></i>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showUpsell && (
          <UpsellModal 
            onAccept={handleUpsellAccept}
            onReject={handleUpsellReject}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pricing;
