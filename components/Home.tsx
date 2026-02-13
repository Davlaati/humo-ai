
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Word } from '../types';
import { getDictionaryDefinition, playTextToSpeech } from '../services/geminiService';
import { DICTIONARY } from '../data/dictionary';
import { playTapSound } from '../services/audioService';
import LuckWheel from './LuckWheel';

interface HomeProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: UserProfile) => void;
  streakReward?: { days: number, coins: number } | null;
  onClearStreakReward?: () => void;
}

type HumoMood = 'idle' | 'happy' | 'celebrating' | 'thinking' | 'sleeping';

const HumobekAvatar: React.FC<{ mood: HumoMood, streak: number }> = ({ mood, streak }) => {
  const emojis = {
    idle: '🐱',
    happy: '😸',
    celebrating: '😻',
    thinking: '🧐',
    sleeping: '😴'
  };

  const phrases = {
    idle: ["Salom! Bugun nima o'rganamiz?", "Meni sog'indingizmi?", "Ingliz tili - bu kelajak!"],
    happy: ["Ajoyib natija!", "+XP larni yaxshi ko'raman!", "Siz bilan faxrlanaman!"],
    celebrating: ["G'ALABA!", "Siz haqiqiy master ekansiz!", "Uraaa! Stars hub boyimoqda!"],
    thinking: ["Hmmm, qiziq...", "Lekin qanday qilib?", "Keling, o'ylab ko'ramiz."],
    sleeping: ["Zzz... biroz charchadim.", "Uxlayapman...", "Keyinroq gaplashamiz."]
  };

  const [currentPhrase, setCurrentPhrase] = useState("");

  useEffect(() => {
    const p = phrases[mood];
    setCurrentPhrase(p[Math.floor(Math.random() * p.length)]);
  }, [mood]);

  return (
    <div className="flex flex-col items-center">
      {/* Thought Bubble */}
      <div className="relative mb-6 glass-card px-4 py-2 rounded-2xl border border-white/20 animate-fade-in shadow-xl max-w-[200px] text-center">
        <p className="text-[11px] font-bold text-white italic">"{currentPhrase}"</p>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
      </div>

      <div className="relative">
        {/* Aura for celebration */}
        {mood === 'celebrating' && (
          <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-pulse-ring pointer-events-none"></div>
        )}
        
        {/* Character Container */}
        <div className={`w-40 h-40 bg-gradient-to-b from-white/20 to-white/5 rounded-full flex items-center justify-center text-7xl shadow-inner border border-white/10 relative overflow-visible transition-all duration-500 ${mood === 'happy' || mood === 'celebrating' ? 'animate-wiggle scale-110' : 'animate-bounce-slow'}`}>
          {streak >= 5 && (
            <div className="absolute -top-6 -right-2 text-4xl transform rotate-12 drop-shadow-md">👑</div>
          )}
          {emojis[mood]}
          
          {/* Status Dot */}
          <div className={`absolute bottom-3 right-5 w-6 h-6 rounded-full border-4 border-slate-900 shadow-lg ${mood === 'sleeping' ? 'bg-blue-400' : 'bg-green-500'}`}></div>
        </div>

        {/* Particle effects for achievement */}
        {(mood === 'happy' || mood === 'celebrating') && (
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute -top-4 left-0 text-yellow-400 font-black animate-float-up-fade text-xs">+XP</span>
            <span className="absolute -top-10 right-0 text-blue-400 font-black animate-float-up-fade text-xs" style={{animationDelay: '0.3s'}}>+HC</span>
            <span className="absolute top-0 left-1/2 text-purple-400 font-black animate-float-up-fade text-xs" style={{animationDelay: '0.6s'}}>STARS</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Home: React.FC<HomeProps> = ({ user, onNavigate, onUpdateUser, streakReward, onClearStreakReward }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localResults, setLocalResults] = useState<Word[]>([]);
  const [dictionaryResults, setDictionaryResults] = useState<Omit<Word, 'mastered'>[]>([]);
  const [onlineResult, setOnlineResult] = useState<{definition?: string, translation?: string, example?: string} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showLuckWheel, setShowLuckWheel] = useState(false);
  
  // Character Mood State
  const [mood, setMood] = useState<HumoMood>('idle');
  const moodTimerRef = useRef<any>(null);
  const prevStats = useRef({ xp: user.xp, wins: user.wins || 0 });

  useEffect(() => {
    // Detect XP or Win increases
    const xpGained = user.xp > prevStats.current.xp;
    const winGained = (user.wins || 0) > prevStats.current.wins;

    if (xpGained || winGained) {
      setMood(winGained ? 'celebrating' : 'happy');
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
      moodTimerRef.current = setTimeout(() => setMood('idle'), 5000);
      playTapSound();
    }

    prevStats.current = { xp: user.xp, wins: user.wins || 0 };
  }, [user.xp, user.wins]);

  useEffect(() => {
    if (streakReward) {
      setMood('celebrating');
      const timer = setTimeout(() => {
        if (onClearStreakReward) onClearStreakReward();
        setMood('idle');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [streakReward]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setLocalResults([]);
      setDictionaryResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filteredLocal = (user.learnedWords || []).filter(w => 
      w.term.toLowerCase().includes(lowerQuery) || 
      w.translation.toLowerCase().includes(lowerQuery)
    );
    setLocalResults(filteredLocal);
    const filteredDict = DICTIONARY.filter(w => 
      (w.term.toLowerCase().includes(lowerQuery) || w.translation.toLowerCase().includes(lowerQuery))
    ).slice(0, 5);
    setDictionaryResults(filteredDict);
  };

  const handleOnlineSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setMood('thinking');
    const result = await getDictionaryDefinition(searchQuery);
    setOnlineResult(result);
    setIsSearching(false);
    setMood('happy');
    setTimeout(() => setMood('idle'), 3000);
  };

  const handleAction = (tab: string | (() => void)) => {
    playTapSound();
    if (typeof tab === 'string') onNavigate(tab);
    else tab();
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center relative z-20 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salom, {user.name} 👋</h1>
          <p className="text-gray-400 text-sm font-medium">{user.streak} kunlik streak</p>
        </div>
        <div 
          onClick={() => handleAction('wallet')}
          className="flex items-center space-x-2 glass-panel px-3 py-1.5 rounded-full border border-white/10 active:scale-95 transition-all"
        >
          <i className="fa-solid fa-coins text-yellow-400"></i>
          <span className="font-bold">{user.coins}</span>
        </div>
      </div>

      {/* Main Character Zone */}
      <div className="glass-card rounded-[40px] p-8 flex flex-col items-center relative overflow-hidden min-h-[360px] justify-center bg-gradient-to-b from-blue-900/10 to-transparent">
        <HumobekAvatar mood={mood} streak={user.streak} />
        
        <div className="w-full max-w-[220px] mt-8">
          <div className="w-full bg-slate-700/30 h-2.5 rounded-full overflow-hidden mb-2 border border-white/5">
            <div 
              className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full transition-all duration-1000" 
              style={{ width: `${Math.min(user.xp % 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-center font-black text-gray-500 uppercase tracking-widest">Level Progress: {user.xp % 100}/100 XP</p>
        </div>
      </div>

      {/* Global Search */}
      <div className="relative z-50">
        <div className="glass-panel p-1 rounded-2xl flex items-center px-4 py-3.5 bg-slate-800/40">
          <i className="fa-solid fa-magnifying-glass text-gray-500 mr-3"></i>
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="So'z yoki ibora qidiring..." 
            className="bg-transparent w-full focus:outline-none text-sm font-medium"
          />
        </div>
        {searchQuery && (
          <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-2xl p-4 shadow-2xl backdrop-blur-3xl bg-slate-900/95 border border-white/10 max-h-[50vh] overflow-y-auto z-50">
             {localResults.length > 0 && (
               <div className="mb-4">
                 <h4 className="text-[10px] font-black text-gray-500 uppercase mb-2">Sizning so'zlaringiz</h4>
                 {localResults.map((w, i) => (
                   <div key={i} className="p-2 border-b border-white/5 flex justify-between items-center">
                     <span className="font-bold text-sm">{w.term}</span>
                     <span className="text-xs text-gray-400">{w.translation}</span>
                   </div>
                 ))}
               </div>
             )}
             <button 
              onClick={handleOnlineSearch}
              className="w-full py-3 bg-blue-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center"
             >
               {isSearching ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : <i className="fa-solid fa-brain mr-2"></i>}
               AI dan so'rash
             </button>
             {onlineResult && (
               <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 animate-fade-in">
                  <p className="text-sm leading-relaxed mb-2">{onlineResult.definition}</p>
                  <p className="text-xs font-bold text-yellow-400">{onlineResult.translation}</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-4">
        <ActionCard title="Darslar" icon="fa-book" color="bg-orange-500" onClick={() => handleAction('learn')} />
        <ActionCard title="Baxt Charxi" icon="fa-arrows-spin" color="bg-purple-600" onClick={() => handleAction(() => setShowLuckWheel(true))} />
        <ActionCard title="Speaking" icon="fa-headset" color="bg-blue-500" onClick={() => handleAction('speaking-club')} />
        <ActionCard title="Wallet" icon="fa-wallet" color="bg-emerald-500" onClick={() => handleAction('wallet')} />
      </div>

      {showLuckWheel && (
        <LuckWheel 
          user={user} 
          onUpdateUser={onUpdateUser} 
          onClose={() => setShowLuckWheel(false)} 
        />
      )}
    </div>
  );
};

const ActionCard: React.FC<{ title: string; icon: string; color: string; onClick: () => void }> = ({ title, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all border border-white/5 group"
  >
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform`}>
      <i className={`fa-solid ${icon} text-xl text-white`}></i>
    </div>
    <span className="font-black text-[11px] uppercase tracking-widest text-gray-200">{title}</span>
  </div>
);

export default Home;
