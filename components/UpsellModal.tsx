
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface UpsellModalProps {
  onAccept: () => void;
  onReject: () => void;
}

const UpsellModal: React.FC<UpsellModalProps> = ({ onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-[40px] p-8 shadow-2xl overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-600/20 rounded-full blur-[60px]"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <i className="fa-solid fa-gift text-white text-4xl"></i>
          </div>

          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
            Shoshmang!
          </h2>
          
          <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-6">
            Maxsus taklif siz uchun
          </p>

          <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/5 w-full">
            <p className="text-slate-300 text-sm font-bold leading-relaxed mb-4">
              Hozir 1 yillik tarifni xarid qilsangiz, Ravona AI sizga yana <span className="text-emerald-400 font-black">+1 OY BEPUL</span> qo'shib beradi! (Jami 13 oy)
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-red-500 font-black text-2xl">
              <i className="fa-solid fa-clock"></i>
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <button 
            onClick={onAccept}
            className="w-full py-5 bg-emerald-500 text-slate-950 rounded-[25px] font-black text-lg uppercase tracking-widest shadow-xl active:scale-95 transition-all mb-4"
          >
            1 yil + 1 oy sovg'ani olaman
          </button>

          <button 
            onClick={onReject}
            className="text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
          >
            Yo'q, o'z tarifimda qolaman
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UpsellModal;
