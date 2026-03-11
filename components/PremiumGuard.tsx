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
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
      {/* The locked content with blur and reduced opacity */}
      <div className="w-full h-full opacity-40 blur-md pointer-events-none select-none">
        {children}
      </div>

      {/* The overlay with the lock icon and message */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10 p-6 text-center">
        <div className="w-16 h-16 bg-slate-800/80 backdrop-blur-xl rounded-full flex items-center justify-center mb-4 shadow-2xl border border-white/10">
          <Lock className="w-8 h-8 text-yellow-500" />
        </div>
        
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
          Premium Required
        </h3>
        
        <p className="text-slate-300 text-sm mb-6 max-w-[250px]">
          Unlock <span className="font-bold text-white">{featureName}</span> and all other exclusive features by upgrading to Premium.
        </p>
        
        <button
          onClick={onUnlockClick}
          className="bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 font-black px-8 py-3 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95 transition-all"
        >
          Unlock Now
        </button>
      </div>
    </div>
  );
};
