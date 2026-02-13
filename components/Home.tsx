
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { playTapSound } from '../services/audioService';
import CoinEffect from './CoinEffect';

interface HomeProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: UserProfile) => void;
}

const HUMO_MESSAGES = [
  "Bugun nimani o'rganamiz?",
  "Sizning ingliz tilingiz zo'r bo'lib ketyapti!",
  "Speaking Clubda yangi do'stlar bor!",
  "Humo Coinlarni yig'ib Starsga almashtiring.",
  "Darslarni qoldirmang, streak buziladi!"
];

const Home: React.FC<HomeProps> = ({ user, onNavigate }) => {
  const [coinAnim, setCoinAnim] = useState<any>(null);
  const [mood, setMood] = useState('idle');
  const [bubbleText, setBubbleText] = useState(HUMO_MESSAGES[0]);
  const prevXp = useRef(user.xp);

  useEffect(() => {
    if (user.xp > prevXp.current) {
      setCoinAnim({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setMood('happy');
      setBubbleText("Dahshat! +XP ishladik!");
      prevXp.current = user.xp;
      setTimeout(() => setMood('idle'), 3000);
    }
  }, [user.xp]);

  const handleAction = (tab: string) => {
    if (user.coins <= 0 && ['learn', 'speaking-club', 'game'].includes(tab)) {
        alert("Purchase Humo coins to use this function. Funksiyadan foydalanish uchun Humo Coin sotib oling.");
        onNavigate('wallet');
        return;
    }
    playTapSound();
    onNavigate(tab);
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up h-full overflow-y-auto no-scrollbar bg-slate-900 text-white">
      {coinAnim && <CoinEffect startX={coinAnim.x} startY={coinAnim.y} onComplete={() => setCoinAnim(null)} />}
      
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-black italic uppercase text-blue-400 tracking-tighter">Humo AI</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{user.streak} kunlik streak 🔥</p>
        </div>
        <div onClick={() => onNavigate('wallet')} className="flex items-center space-x-3 glass-panel px-4 py-2 rounded-2xl border border-white/10 active:scale-95 transition shadow-lg cursor-pointer">
           <div className="relative"><i className="fa-solid fa-coins text-yellow-500"></i><div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div></div>
           <span className="font-black text-sm">{user.coins}</span>
        </div>
      </div>

      <div className="glass-card rounded-[45px] p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[340px] border border-white/5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
          <div className="absolute top-6 px-6 py-3 bg-white text-slate-900 rounded-2xl rounded-bl-none shadow-2xl max-w-[80%] z-20 animate-bounce-slow">
             <p className="text-[10px] font-bold leading-tight">{bubbleText}</p>
             <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white rotate-45"></div>
          </div>
          <div className={`text-9xl transition-all duration-500 transform ${mood === 'happy' ? 'scale-110' : 'scale-100 animate-bounce-slow'} filter drop-shadow-[0_10px_30px_rgba(59,130,246,0.3)]`}>
            {mood === 'happy' ? '🤩' : '🦉'}
          </div>
          <div className="mt-10 w-full max-w-[200px]">
              <div className="flex justify-between text-[8px] font-black uppercase text-gray-500 mb-2 tracking-widest">
                  <span>Level {Math.floor(user.xp / 100) + 1}</span>
                  <span>{user.xp % 100}/100 XP</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(user.xp % 100)}%` }}></div></div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ActionCard title="Darslar" icon="fa-book-open-reader" color="bg-orange-500" onClick={() => handleAction('learn')} />
        <ActionCard title="Suhbat" icon="fa-headset" color="bg-indigo-600" onClick={() => handleAction('speaking-club')} />
        <ActionCard title="Lug'at" icon="fa-language" color="bg-emerald-500" onClick={() => handleAction('wordbank')} />
        <ActionCard title="Hamyon" icon="fa-wallet" color="bg-purple-600" onClick={() => handleAction('wallet')} />
      </div>
    </div>
  );
};

const ActionCard = ({ title, icon, color, onClick }: any) => (
  <div onClick={onClick} className="glass-card p-6 rounded-[32px] flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all cursor-pointer border border-white/5 hover:border-white/20 group">
    <div className={`w-14 h-14 ${color} rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform`}><i className={`fa-solid ${icon} text-2xl text-white`}></i></div>
    <span className="font-black text-[10px] uppercase tracking-widest text-white">{title}</span>
  </div>
);

export default Home;
