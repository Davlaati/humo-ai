import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { playTapSound } from '../services/audioService';
import { ArrowLeft, Zap, Flame, AlertCircle, HelpCircle } from 'lucide-react';
import { GameTutorOverlay } from './GameTutorOverlay';

interface WordChainProps {
  user: UserProfile;
  onBack: () => void;
}

const WordChain: React.FC<WordChainProps> = ({ user, onBack }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [word, setWord] = useState('');
  const [lastWord, setLastWord] = useState('Kutilyapti...');
  const [message, setMessage] = useState('O\'yinni boshlash uchun so\'z kiriting!');
  const [combo, setCombo] = useState(0);
  const [lastUser, setLastUser] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTutor, setShowTutor] = useState(() => {
    return localStorage.getItem('tutor_word_chain') !== 'seen';
  });

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.emit('word-chain:join');

    s.on('word-chain:update', (data: { lastWord: string; message: string; combo: number; lastUser: string }) => {
      setLastWord(data.lastWord);
      setMessage(data.message);
      setCombo(data.combo);
      setLastUser(data.lastUser);
      setError('');
      setWord('');
    });

    s.on('word-chain:error', (errMsg: string) => {
      setError(errMsg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    });

    return () => { s.disconnect(); };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (socket && word.trim()) {
      playTapSound();
      socket.emit('word-chain:submit', { word, userId: user.id, userName: user.name });
    }
  };

  const lastChar = lastWord.slice(-1).toUpperCase();
  const restOfWord = lastWord.slice(0, -1).toUpperCase();

  return (
    <div className="h-full w-full bg-[#0c1222] flex flex-col animate-fade-in overflow-hidden relative">
      {showTutor && (
        <GameTutorOverlay 
          gameName="SO'Z ZANJIRI"
          instructions={[
            "Do'stlaringiz bilan so'z zanjirini davom ettiring!",
            "Oldingi so'zning oxirgi harfiga boshlanadigan so'z yozing.",
            "Faqat ingliz tilidagi mavjud so'zlardan foydalaning.",
            "Takrorlangan so'zlar qabul qilinmaydi."
          ]}
          onClose={() => {
            setShowTutor(false);
            localStorage.setItem('tutor_word_chain', 'seen');
          }}
        />
      )}
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl border-b border-white/5 relative z-10">
        <button 
          onClick={() => { playTapSound(); onBack(); }}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">So'z Zanjiri</h2>
        </div>
        <button 
          onClick={() => setShowTutor(true)}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition active:scale-90"
        >
          <HelpCircle className="w-5 h-5 text-white/50" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col relative z-10">
        
        {/* Combo Counter */}
        <AnimatePresence mode="wait">
          {combo > 0 && (
            <motion.div 
              key={combo}
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="flex items-center justify-center gap-2 mb-8"
            >
              <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 italic">
                {combo}x COMBO
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Word Display */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Oxirgi so'z ({lastUser}):</p>
          <motion.div 
            key={lastWord}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center break-all"
          >
            <span className="text-5xl md:text-7xl font-black text-white tracking-tighter">
              {restOfWord}
            </span>
            <span className="text-6xl md:text-8xl font-black text-yellow-400 tracking-tighter animate-pulse">
              {lastChar}
            </span>
          </motion.div>
          <p className="mt-6 text-slate-300 font-medium text-center bg-white/5 px-4 py-2 rounded-full border border-white/10">
            {message}
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center justify-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-2xl border border-red-500/20"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="font-bold text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="mt-auto relative">
          <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}>
            <input 
              ref={inputRef}
              value={word} 
              onChange={(e) => setWord(e.target.value)}
              className="w-full bg-slate-800/80 border-2 border-white/10 rounded-[24px] p-5 pl-6 pr-16 text-xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-yellow-500/50 transition-colors shadow-xl"
              placeholder={`"${lastChar}" dan boshlanuvchi so'z...`}
              autoComplete="off"
              maxLength={30}
            />
            <button 
              type="submit"
              disabled={!word.trim()}
              className="absolute right-3 top-3 bottom-3 aspect-square bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 rounded-[18px] flex items-center justify-center transition-colors active:scale-95"
            >
              <Zap className="w-6 h-6" />
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default WordChain;
