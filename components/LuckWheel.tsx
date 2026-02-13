import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { saveUser } from '../services/storageService';

interface LuckWheelProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onClose: () => void;
}

interface Reward {
  id: number;
  label: string;
  value: number;
  type: 'coins' | 'xp' | 'multiplier';
  icon: string;
  color: string;
}

const REWARDS: Reward[] = [
  { id: 0, label: 'x500', value: 500, type: 'coins', icon: 'fa-coins', color: '#fbbf24' },
  { id: 1, label: 'x25', value: 25, type: 'coins', icon: 'fa-coins', color: '#fbbf24' },
  { id: 2, label: 'x2 XP', value: 2, type: 'multiplier', icon: 'fa-bolt', color: '#8b5cf6' },
  { id: 3, label: 'x50', value: 50, type: 'coins', icon: 'fa-coins', color: '#f59e0b' },
  { id: 4, label: 'x2 HC', value: 2, type: 'multiplier', icon: 'fa-coins', color: '#f59e0b' },
  { id: 5, label: 'x25', value: 25, type: 'coins', icon: 'fa-coins', color: '#fbbf24' },
  { id: 6, label: 'x2 XP', value: 2, type: 'multiplier', icon: 'fa-bolt', color: '#8b5cf6' },
  { id: 7, label: 'Bonus', value: 100, type: 'xp', icon: 'fa-star', color: '#10b981' },
];

const LuckWheel: React.FC<LuckWheelProps> = ({ user, onUpdateUser, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeftToFreeSpin, setTimeLeftToFreeSpin] = useState<string>('');

  const canFreeSpin = !user.lastSpinDate || new Date(user.lastSpinDate).toDateString() !== new Date().toDateString();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeftToFreeSpin(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSpin = (cost: number = 0) => {
    if (isSpinning) return;
    if (cost > user.coins) {
      alert("Mablag' yetarli emas!");
      return;
    }

    setIsSpinning(true);
    setResult(null);
    setShowResult(false);

    // Calculate rotation
    const segmentDegree = 360 / REWARDS.length;
    const randomSegment = Math.floor(Math.random() * REWARDS.length);
    const extraRotations = 5 + Math.floor(Math.random() * 5); // 5 to 10 full spins
    const targetRotation = rotation + (extraRotations * 360) + (randomSegment * segmentDegree);
    
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const reward = REWARDS[(REWARDS.length - randomSegment) % REWARDS.length];
      setResult(reward);
      
      // Update user state
      const newUser = { ...user };
      if (cost === 0) {
        newUser.lastSpinDate = new Date().toISOString();
      } else {
        newUser.coins -= cost;
      }

      if (reward.type === 'coins') newUser.coins += reward.value;
      if (reward.type === 'xp') newUser.xp += reward.value;
      // Multipliers could be a session state, for now we give a small XP boost as "luck"
      if (reward.type === 'multiplier') newUser.xp += 50;

      onUpdateUser(newUser);
      
      setTimeout(() => setShowResult(true), 500);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in overflow-hidden">
      {/* Background Confetti (Simulated via divs) */}
      {showResult && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                backgroundColor: ['#fbbf24', '#3b82f6', '#ef4444', '#10b981', '#a855f7'][Math.floor(Math.random() * 5)],
                animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 px-6 flex justify-between items-center z-20">
        <button onClick={onClose} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/60">
          <i className="fa-solid fa-xmark"></i>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Free spin every day</span>
        <div className="w-10"></div>
      </div>

      {!showResult ? (
        <div className="flex flex-col items-center w-full max-w-sm animate-slide-up">
          <h1 className="text-2xl font-black text-center mb-2">
            {canFreeSpin ? "Daily Free Spin!" : "You have already used your Free Spin"}
          </h1>
          <p className="text-gray-400 text-sm mb-12">Try your luck and win Humo Coins!</p>

          {/* Wheel Container */}
          <div className="relative w-72 h-72 mb-16 group">
            {/* Outer Glow */}
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>
            
            {/* The Pointer */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                <i className="fa-solid fa-caret-down text-4xl text-purple-500"></i>
            </div>

            {/* The Wheel */}
            <div 
              className="w-full h-full rounded-full border-8 border-slate-800 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {REWARDS.map((reward, i) => {
                const angle = 360 / REWARDS.length;
                return (
                  <div 
                    key={i}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 origin-bottom flex flex-col items-center pt-4"
                    style={{ transform: `translateX(-50%) rotate(${i * angle}deg)` }}
                  >
                    <div className="flex flex-col items-center space-y-1">
                        <i className={`fa-solid ${reward.icon} text-xl`} style={{ color: reward.color }}></i>
                        <span className="text-[10px] font-black uppercase" style={{ color: reward.color }}>{reward.label}</span>
                    </div>
                    {/* Divider Lines */}
                    <div className="absolute bottom-0 h-full w-px bg-white/10 origin-bottom" style={{ transform: `rotate(${angle / 2}deg)` }}></div>
                  </div>
                );
              })}
              {/* Inner Circle Decoration */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1/3 h-1/3 bg-slate-900 rounded-full border-4 border-slate-800 shadow-inner flex flex-col items-center justify-center text-center p-2">
                     <span className="text-[8px] text-gray-500 font-bold uppercase leading-tight">Next Spin</span>
                     <span className="text-[10px] font-black text-white">{timeLeftToFreeSpin}</span>
                  </div>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4">
             {canFreeSpin ? (
               <button 
                 onClick={() => handleSpin(0)}
                 disabled={isSpinning}
                 className="w-full py-5 rounded-2xl liquid-button font-black text-lg shadow-2xl active:scale-95 transition flex items-center justify-center group"
               >
                 <span className={isSpinning ? 'animate-pulse' : ''}>{isSpinning ? 'SPINNING...' : 'FREE SPIN NOW'}</span>
                 {!isSpinning && <i className="fa-solid fa-bolt ml-2 animate-bounce"></i>}
               </button>
             ) : (
               <button 
                 onClick={() => handleSpin(25)}
                 disabled={isSpinning}
                 className="w-full py-5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-yellow-500/50 text-white font-black text-lg shadow-2xl active:scale-95 transition flex items-center justify-center"
               >
                 <span>SPIN AGAIN FOR 25</span>
                 <i className="fa-solid fa-coins ml-2 text-yellow-500"></i>
               </button>
             )}
             <p className="text-center text-[10px] text-gray-500 uppercase font-black tracking-widest">
               Daily limit: 1 free spin
             </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-sm animate-slide-up text-center">
            {/* User result screenshot style: "Well done!" */}
            <div className="w-full bg-green-500/10 border-2 border-green-500/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-2xl transform rotate-12 mb-6">
                        <i className={`fa-solid ${result?.icon} text-5xl text-white`}></i>
                    </div>
                    
                    <h2 className="text-4xl font-black text-white mb-2">Well done!</h2>
                    <p className="text-green-400 font-bold mb-8 italic">"Wow, you're truly natural!"</p>

                    <div className="flex space-x-3 mb-8">
                        <div className="flex-1 bg-white/5 rounded-2xl p-4">
                            <span className="text-[10px] text-gray-500 font-black uppercase block mb-1">Earned</span>
                            <span className="text-xl font-black text-white">+{result?.value} {result?.type === 'coins' ? 'HC' : 'XP'}</span>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-2xl p-4">
                            <span className="text-[10px] text-gray-500 font-black uppercase block mb-1">Luck</span>
                            <span className="text-xl font-black text-white">100%</span>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-green-500 text-slate-900 font-black rounded-2xl shadow-xl active:scale-95 transition uppercase tracking-widest"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes fall {
          to { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LuckWheel;