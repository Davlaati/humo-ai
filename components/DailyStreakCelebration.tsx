import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import { Flame } from 'lucide-react';

interface DailyStreakCelebrationProps {
  streak: number;
}

const DailyStreakCelebration: React.FC<DailyStreakCelebrationProps> = ({ streak }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Motion values for the number counter (N - 1 to N)
  const count = useMotionValue(Math.max(0, streak - 1));
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    // 1. Check localStorage for today's date
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('lastStreakShownDate');
    
    // If it hasn't been shown today and streak is valid, show it
    if (lastShown !== today && streak > 0) {
      setIsVisible(true);
    }
  }, [streak]);

  useEffect(() => {
    if (!isVisible) return;

    // 2. Animate the number rolling up
    const controls = animate(count, streak, {
      duration: 1.5,
      ease: "easeOut",
      onComplete: () => {
        // 3. Trigger Haptic Feedback when the number hits the final value
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('heavy');
          tg.HapticFeedback.notificationOccurred('success');
        }
      }
    });

    // 4. Auto-close after exactly 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      controls.stop();
      clearTimeout(timer);
    };
  }, [isVisible, streak, count]);

  const handleClose = () => {
    // Save today's date so it doesn't show again until tomorrow
    const today = new Date().toDateString();
    localStorage.setItem('lastStreakShownDate', today);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#0a0f24] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"></div>

          {/* The Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
            className="relative z-10 mb-6"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.5)] border-4 border-orange-500/30">
              <Flame className="w-16 h-16 text-white fill-white" />
            </div>
          </motion.div>

          {/* The Number Counter */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.h1 
              className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-lg"
            >
              {rounded}
            </motion.h1>
            <p className="text-slate-400 text-xl font-bold uppercase tracking-[0.2em] mt-2">
              day streak
            </p>
          </motion.div>

          {/* Close Button */}
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
            onClick={handleClose}
            className="absolute bottom-12 w-[calc(100%-3rem)] max-w-sm mx-auto bg-white/10 backdrop-blur-xl border border-white/20 py-4 rounded-2xl text-white font-black text-lg tracking-widest uppercase active:scale-95 transition-transform shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-20"
          >
            Davom etish
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyStreakCelebration;
