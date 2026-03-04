
import React from 'react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PaywallProps {
  user: UserProfile;
  onActivate: () => void;
  onClose: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ user, onActivate, onClose }) => {
  // Mocking stats for FOMO
  const chatCount = Math.floor(Math.random() * 50) + 20;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[6000] flex items-center justify-center p-6"
      >
        {/* Blur Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose}></div>
        
        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px]"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[60px]"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg rotate-3">
              <i className="fa-solid fa-crown text-white text-4xl"></i>
            </div>

            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4 leading-tight">
              Sizning sinov muddatingiz tugadi!
            </h2>

            <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/5 w-full">
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                Siz 3 kun ichida AI bilan <span className="text-blue-400 font-black">{chatCount}</span> marta suhbatlashdingiz. Bu tezlikni yo'qotmang!
              </p>
            </div>

            <button 
              onClick={onActivate}
              className="w-full py-5 bg-white text-slate-950 rounded-[25px] font-black text-lg uppercase tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all mb-4"
            >
              Premiumni faollashtirish
            </button>

            <button 
              onClick={onClose}
              className="text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
            >
              Keyinroq
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Paywall;
