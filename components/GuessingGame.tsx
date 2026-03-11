import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { playTapSound } from '../services/audioService';
import { ArrowLeft, MessageSquare, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

interface GuessingGameProps {
  user: UserProfile;
  onBack: () => void;
}

const GuessingGame: React.FC<GuessingGameProps> = ({ user, onBack }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [guess, setGuess] = useState('');
  const [clue, setClue] = useState('Kutilyapti...');
  const [message, setMessage] = useState('O\'yinni boshlash uchun kutib turing!');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.emit('guessing-game:join');

    s.on('guessing-game:update', (data: { clue: string; message: string }) => {
      setClue(data.clue);
      setMessage(data.message);
      setError('');
      setSuccess(false);
      setGuess('');
    });

    s.on('guessing-game:error', (errMsg: string) => {
      setError(errMsg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    });

    s.on('guessing-game:success', (data: { winner: string; answer: string; message: string }) => {
      setSuccess(true);
      setMessage(data.message);
      setError('');
    });

    return () => { s.disconnect(); };
  }, []);

  const handleGuess = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (socket && guess.trim() && !success) {
      playTapSound();
      socket.emit('guessing-game:submit', { guess, userId: user.id, userName: user.name });
    }
  };

  return (
    <div className="h-full w-full bg-[#0c1222] flex flex-col animate-fade-in overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
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
          <MessageSquare className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Topishmoq</h2>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col relative z-10">
        
        {/* Riddle Display */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                  <CheckCircle2 className="w-16 h-16 text-green-400" />
                </div>
                <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Topildi!</h3>
                <p className="text-green-400 font-bold text-lg">{message}</p>
              </motion.div>
            ) : (
              <motion.div 
                key={clue}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="w-full max-w-sm"
              >
                <div className="glass-card p-8 rounded-[32px] border border-white/10 bg-slate-800/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
                  <Sparkles className="w-8 h-8 text-green-400 mb-6 opacity-50" />
                  <p className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                    {clue}
                  </p>
                </div>
                <p className="mt-6 text-slate-400 font-medium text-center text-sm uppercase tracking-widest">
                  {message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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
        <form onSubmit={handleGuess} className="mt-auto relative">
          <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}>
            <input 
              ref={inputRef}
              value={guess} 
              onChange={(e) => setGuess(e.target.value)}
              disabled={success}
              className="w-full bg-slate-800/80 border-2 border-white/10 rounded-[24px] p-5 pl-6 pr-16 text-xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-colors shadow-xl disabled:opacity-50"
              placeholder="Javobni yozing..."
              autoComplete="off"
              maxLength={30}
            />
            <button 
              type="submit"
              disabled={!guess.trim() || success}
              className="absolute right-3 top-3 bottom-3 aspect-square bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 rounded-[18px] flex items-center justify-center transition-colors active:scale-95"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default GuessingGame;
