
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, CheckCircle, Loader2, X, Info, Gift } from 'lucide-react';
import { UserProfile } from '../types';
import { playTapSound, playSuccessSound } from '../services/audioService';

interface StoryTaskModalProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

const StoryTaskModal: React.FC<StoryTaskModalProps> = ({ user, onClose, onSuccess }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShareStory = () => {
    playTapSound();
    
    // Telegram WebApp API for sharing stories
    // Note: This is a specialized API. If not available, we use a fallback.
    if ((window as any).Telegram?.WebApp?.shareToStory) {
      const storyMediaUrl = "https://picsum.photos/seed/ravona/1080/1920"; // Placeholder for dynamic image
      const text = "Ravona AI bilan ingliz tilini o'rganing! 🚀";
      const widgetLink = {
        url: `https://t.me/ravonaai_bot?start=ref_${user.id}`,
        name: "Ravona AI"
      };
      
      (window as any).Telegram.WebApp.shareToStory(storyMediaUrl, {
        text,
        widget_link: widgetLink
      });
    } else {
      // Fallback: Open a link to share
      const shareUrl = `https://t.me/share/url?url=https://t.me/ravonaai_bot?start=ref_${user.id}&text=Ravona AI bilan ingliz tilini o'rganing! 🚀`;
      window.open(shareUrl, '_blank');
    }
  };

  const handleVerify = async () => {
    playTapSound();
    setIsVerifying(true);
    setError(null);

    try {
      // Simulate backend verification
      // In a real app, this would call an endpoint that checks if the story was actually posted
      // For now, we'll simulate a successful verification after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      const now = new Date();
      const currentPremiumUntil = user.premiumUntil ? new Date(user.premiumUntil) : now;
      const baseDate = currentPremiumUntil > now ? currentPremiumUntil : now;
      
      const newPremiumUntil = new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000); // +4 days

      const updatedUser: UserProfile = {
        ...user,
        isPremium: true,
        premiumUntil: newPremiumUntil.toISOString(),
        story_reward_claimed: true
      };

      playSuccessSound();
      onSuccess(updatedUser);
    } catch (err) {
      setError("Tasdiqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-slate-900 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
            <Share2 className="text-blue-500 w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Vazifani bajaring</h2>
          <p className="text-slate-400 text-sm mb-8">
            Ravona AI-ni Telegram Story-da ulashing va 4 kunlik qo'shimcha Premium oling!
          </p>

          <div className="w-full space-y-4 mb-8">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white">1</div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-sm">Story-da ulashish</p>
                <p className="text-slate-500 text-xs">Ilova haqida story joylang</p>
              </div>
              <button 
                onClick={handleShareStory}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg active:scale-95 transition-transform"
              >
                Ulashish
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white">2</div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-sm">Tasdiqlash</p>
                <p className="text-slate-500 text-xs">Story joylanganini tasdiqlang</p>
              </div>
              <button 
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-4 py-2 bg-emerald-600 disabled:bg-slate-700 text-white text-xs font-bold rounded-lg active:scale-95 transition-transform flex items-center gap-2"
              >
                {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                Tasdiqlash
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs mb-6">
              <Info className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <Gift className="w-4 h-4" />
            Mukofot: +4 kun Premium
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StoryTaskModal;
