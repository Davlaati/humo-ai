
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { playTapSound } from '../services/audioService';

interface LuckWheelProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onClose: () => void;
}

const REWARDS = [
  { id: 0, label: 'x5 HC', value: 5, type: 'coins', icon: 'fa-coins', color: '#fbbf24' },
  { id: 1, label: 'x2 XP', value: 2, type: 'xp', icon: 'fa-bolt', color: '#8b5cf6' },
  { id: 2, label: 'x10 HC', value: 10, type: 'coins', icon: 'fa-coins', color: '#f59e0b' },
  { id: 3, label: '100 XP', value: 100, type: 'xp', icon: 'fa-star', color: '#10b981' },
  { id: 4, label: 'x3 HC', value: 3, type: 'coins', icon: 'fa-coins', color: '#fbbf24' },
  { id: 5, label: 'Small Gift', value: 1, type: 'coins', icon: 'fa-gift', color: '#f59e0b' },
];

const LuckWheel: React.FC<LuckWheelProps> = ({ user, onUpdateUser, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); if(!isSpinning && !showResult) onClose(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSpinning, showResult]);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    playTapSound();
    const segmentDegree = 360 / REWARDS.length;
    const randomSegment = Math.floor(Math.random() * REWARDS.length);
    const targetRotation = rotation + (10 * 360) + (randomSegment * segmentDegree);
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const reward = REWARDS[(REWARDS.length - randomSegment) % REWARDS.length];
      setResult(reward);
      const newUser = { ...user };
      if (reward.type === 'coins') newUser.coins += reward.value;
      if (reward.type === 'xp') newUser.xp += reward.value;
      onUpdateUser(newUser);
      setShowResult(true);
      setTimeout(onClose, 2500);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-slate-900/95 backdrop-blur-3xl animate-fade-in">
      <div className="absolute top-8 px-6 w-full flex justify-between items-center">
         <div className="bg-red-500/20 text-red-400 px-4 py-1 rounded-full font-black text-[10px]">AVTO-YOPILISH: {timeLeft}s</div>
      </div>
      <div className="flex flex-col items-center w-full max-w-sm">
        <h1 className="text-3xl font-black text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-500">BAXT CHARXI</h1>
        <p className="text-gray-400 text-sm mb-8">Har bir kirishda bepul imkoniyat!</p>
        <div className="relative w-64 h-64 mb-10 group">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 text-white text-4xl drop-shadow-lg"><i className="fa-solid fa-caret-down"></i></div>
          <div className="w-full h-full rounded-full border-4 border-white/10 relative transition-transform duration-[3000ms] cubic-bezier(0.15, 0, 0.15, 1) overflow-hidden shadow-2xl" style={{ transform: `rotate(${rotation}deg)` }}>
            {REWARDS.map((r, i) => (
              <div key={i} className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 origin-bottom flex flex-col items-center pt-2" style={{ transform: `translateX(-50%) rotate(${i * (360 / REWARDS.length)}deg)` }}>
                <i className={`fa-solid ${r.icon} text-lg`} style={{ color: r.color }}></i>
                <span className="text-[8px] font-black uppercase mt-1" style={{ color: r.color }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
        {!showResult ? (
          <button onClick={handleSpin} disabled={isSpinning} className="w-full py-5 rounded-3xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black text-xl shadow-xl active:scale-95 transition">
            {isSpinning ? 'AYLANMOQDA...' : 'AYLANTIRING!'}
          </button>
        ) : (
          <div className="text-center animate-bounce">
             <h2 className="text-2xl font-black text-yellow-400">TABRIKLAYMIZ!</h2>
             <p className="text-white font-bold">+{result.value} {result.type.toUpperCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LuckWheel;
