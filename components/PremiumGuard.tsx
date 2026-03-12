import React from 'react';
import { useUserStore } from '../store/userStore';
import { Lock } from 'lucide-react';

interface PremiumGuardProps {
  featureName: string;
  children: React.ReactNode;
  onUnlockClick: () => void;
}

export const PremiumGuard: React.FC<PremiumGuardProps> = ({ featureName, children, onUnlockClick }) => {
  const isPremiumActive = useUserStore((state) => state.isPremiumActive);

  if (isPremiumActive) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl flex flex-col">
      {/* Locked Content - Unclickable and Blurred */}
      <div className="flex-1 opacity-30 blur-md pointer-events-none select-none overflow-hidden">
        {children}
      </div>

      {/* Absolute Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f24]/60 z-50 p-6 text-center backdrop-blur-sm">
        <div className="w-20 h-20 bg-slate-800/90 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] border border-white/10">
          <Lock className="w-10 h-10 text-yellow-500" />
        </div>
        
        <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight drop-shadow-lg">
          Premium Required
        </h3>
        
        <p className="text-slate-300 text-sm mb-8 max-w-[280px] leading-relaxed">
          Unlock <span className="font-bold text-white">{featureName}</span> and all other exclusive features by upgrading to Premium today.
        </p>
        
        <button
          onClick={onUnlockClick}
          className="bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 font-black px-10 py-4 rounded-full uppercase tracking-widest shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95 transition-all"
        >
          Unlock Now
        </button>
      </div>
    </div>
  );
};
