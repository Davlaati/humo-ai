import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, ChevronRight } from 'lucide-react';

interface GameTutorOverlayProps {
  gameName: string;
  instructions: string[];
  onClose: () => void;
}

export const GameTutorOverlay: React.FC<GameTutorOverlayProps> = ({ gameName, instructions, onClose }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleNext = () => {
    if (step < instructions.length - 1) {
      setStep(s => s + 1);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-sm glass-card rounded-[32px] p-8 relative overflow-hidden border border-white/10 shadow-2xl bg-slate-900/80"
          onClick={handleNext}
        >
          {/* Close Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>

          {/* AI Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-1 shadow-lg shadow-blue-500/30">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <Bot size={32} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
              {gameName}
            </h2>
            <div className="h-16 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-slate-300 font-medium"
                >
                  {instructions[step]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {instructions.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === step ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Tushunarli</span>
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
