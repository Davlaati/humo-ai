import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Gift } from 'lucide-react';

interface PremiumGiftModalProps {
  duration: number;
  onClose: () => void;
}

const PremiumGiftModal: React.FC<PremiumGiftModalProps> = ({ duration, onClose }) => {
  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        className="relative w-full max-w-sm overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-900 to-slate-800 border border-yellow-500/30 shadow-2xl shadow-yellow-500/20"
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/20 rounded-full blur-[60px]"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[60px]"></div>
        </div>

        <div className="relative p-8 text-center flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/30 relative">
            <Crown className="w-12 h-12 text-white" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-white/30"
            />
          </div>

          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-2 uppercase tracking-tight">
            Tabriklaymiz!
          </h2>
          
          <p className="text-slate-300 text-sm mb-8 leading-relaxed">
            Sizga <span className="font-bold text-white">Ravona AI jamoasi</span> tomonidan <span className="font-bold text-yellow-400">{duration} oylik</span> Premium ta'rif hadiya qilindi!
          </p>

          <div className="w-full space-y-3 mb-8">
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-xs font-medium text-slate-200">Barcha kurslarga cheksiz kirish</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
              <Gift className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-medium text-slate-200">Speaking Club va Mock Testlar</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-lg shadow-yellow-500/25 active:scale-95 transition-transform"
          >
            Qabul Qilish
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumGiftModal;
