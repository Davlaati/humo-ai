
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, Share2, CheckCircle, X } from 'lucide-react';
import { UserProfile } from '../types';
import { playTapSound } from '../services/audioService';

interface MarketingModalProps {
  user: UserProfile;
  onClose: () => void;
  onExtend: () => void;
}

const MarketingModal: React.FC<MarketingModalProps> = ({ user, onClose, onExtend }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-slate-900 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl"
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
            <Gift className="text-white w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-white italic tracking-tight mb-3">
            Sizga 3 kunlik Ravona AI Premium sovg'a qilindi!
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Barcha premium AI vositalarini 3 kun davomida bepul sinab ko'rishingiz mumkin. 
            Premium muddatini bepul uzaytirishni xohlaysizmi? Oddiy vazifalarni bajaring.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => {
                playTapSound();
                onExtend();
              }}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Zap className="w-5 h-5" />
              Premium muddatini uzaytirish
            </button>
            
            <button
              onClick={() => {
                playTapSound();
                onClose();
              }}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all active:scale-95"
            >
              Ilovadan foydalanish
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MarketingModal;
