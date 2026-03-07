import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { saveUser } from '../services/storageService';
import { DICTIONARY } from '../data/dictionary';
import { playTapSound, playSuccessSound, playErrorSound } from '../services/audioService';
import { awardXP, awardCoins } from '../services/gamificationService';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Rocket, Play, Flag } from 'lucide-react';

interface CosmicScrambleProps {
  user: UserProfile;
  onUpdateUser?: (user: UserProfile) => void;
  onBack: () => void;
}

type GamePhase = 'menu' | 'playing' | 'result';

const CosmicScramble: React.FC<CosmicScrambleProps> = ({ user, onUpdateUser, onBack }) => {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [fuel, setFuel] = useState(100);
  const [currentWord, setCurrentWord] = useState('');
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [scrambledLetters, setScrambledLetters] = useState<{id: number, char: string}[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<{id: number, char: string}[]>([]);
  const [combo, setCombo] = useState(1);
  const [shake, setShake] = useState(false);
  const [level, setLevel] = useState(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = () => {
    playTapSound();
    setPhase('playing');
    setScore(0);
    setTimeLeft(60);
    setFuel(100);
    setCombo(1);
    setLevel(1);
    nextRound();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
      setFuel((prev) => Math.max(0, prev - 1.5)); // Fuel drains over time
    }, 1000);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('result');
    
    // Reward logic
    const bonusCoins = Math.floor(score / 8);
    const bonusXP = Math.floor(score / 4);

    const updatedUser = awardXP(user, bonusXP);
    const fullyUpdatedUser = awardCoins(updatedUser, bonusCoins);
    
    if (onUpdateUser) {
      onUpdateUser(fullyUpdatedUser);
    } else {
      saveUser(fullyUpdatedUser);
    }
  };

  const nextRound = () => {
    // Pick a random word based on level
    const filtered = DICTIONARY.filter(w => {
      if (level < 3) return w.term.length <= 5;
      if (level < 6) return w.term.length <= 7;
      return w.term.length > 7;
    });
    const randomItem = filtered[Math.floor(Math.random() * filtered.length)] || DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
    const word = randomItem.term.toUpperCase();
    setCurrentWord(word);
    setCurrentTranslation(randomItem.translation);
    
    // Scramble letters
    const letters = word.split('').map((char, index) => ({ id: index, char }));
    // Simple shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setScrambledLetters(letters);
    setSelectedLetters([]);
  };

  const handleLetterSelect = (letter: {id: number, char: string}) => {
    playTapSound();
    const newSelected = [...selectedLetters, letter];
    setSelectedLetters(newSelected);
    setScrambledLetters(scrambledLetters.filter(l => l.id !== letter.id));

    // Check if word is complete
    if (newSelected.length === currentWord.length) {
      const formedWord = newSelected.map(l => l.char).join('');
      if (formedWord === currentWord) {
        // Correct!
        playSuccessSound();
        const points = 10 * combo;
        setScore(s => s + points);
        setCombo(c => Math.min(c + 1, 5)); // Max combo 5x
        setFuel(f => Math.min(100, f + 15)); // Refuel on success
        setLevel(l => l + 1);
        setTimeout(nextRound, 500);
      } else {
        // Wrong!
        playErrorSound();
        setShake(true);
        setCombo(1);
        setFuel(f => Math.max(0, f - 10)); // Lose fuel on error
        setTimeout(() => {
          setShake(false);
          // Return letters
          setScrambledLetters([...scrambledLetters, ...newSelected]);
          setSelectedLetters([]);
        }, 500);
      }
    }
  };

  const handleLetterDeselect = (letter: {id: number, char: string}) => {
    playTapSound();
    setSelectedLetters(selectedLetters.filter(l => l.id !== letter.id));
    setScrambledLetters([...scrambledLetters, letter]);
  };

  if (fuel <= 0 && phase === 'playing') {
    endGame();
  }

  if (phase === 'menu') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden bg-[#050b14]">
        {/* Starry Background */}
        <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute bg-white rounded-full opacity-20 animate-pulse"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 3 + 1}px`,
                        height: `${Math.random() * 3 + 1}px`,
                        animationDuration: `${Math.random() * 3 + 2}s`
                    }}
                ></div>
            ))}
        </div>

        <button 
            onClick={onBack}
            className="absolute top-4 left-4 text-white/50 hover:text-white z-50"
        >
            <ArrowLeft className="text-xl" />
        </button>

        <div className="relative z-10 flex flex-col items-center">
            <div className="w-40 h-40 relative mb-8">
                <div className="absolute inset-0 bg-purple-600 rounded-full blur-[50px] opacity-40 animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 rounded-full border-4 border-purple-400/30 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.4)]">
                    <Rocket className="text-6xl text-purple-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                </div>
                {/* Orbiting elements */}
                <div className="absolute inset-[-20px] border border-purple-500/20 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-[-40px] border border-indigo-500/10 rounded-full animate-spin-reverse-slow"></div>
            </div>

            <h1 className="text-5xl font-black italic mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400 drop-shadow-lg tracking-tighter">
                COSMIC
                <br />
                SCRAMBLE
            </h1>
            <p className="text-purple-300/80 mb-12 font-medium tracking-wide">So'zlarni yig'ing, koinotni zabt eting!</p>

            <button 
                onClick={startGame}
                className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-2xl"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 w-full h-full border-2 border-white/20 rounded-2xl"></div>
                <div className="relative flex items-center space-x-3">
                    <span className="text-xl font-black text-white tracking-widest uppercase">Boshlash</span>
                    <Play className="text-white fill-current" />
                </div>
            </button>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
      return (
        <div className="h-full flex flex-col bg-[#050b14] relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-purple-400 font-bold tracking-widest">Score</span>
                    <span className="text-2xl font-black text-white">{score}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 flex items-center justify-center bg-slate-900/50 backdrop-blur">
                        <span className={`text-xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}
                        </span>
                    </div>
                    {/* Fuel Bar */}
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: `${fuel}%` }}
                            className={`h-full ${fuel < 30 ? 'bg-red-500' : 'bg-purple-500'}`}
                        />
                    </div>
                    <span className="text-[8px] text-purple-400 font-black uppercase tracking-widest">Fuel</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase text-yellow-400 font-bold tracking-widest">Combo</span>
                    <span className="text-2xl font-black text-yellow-400">x{combo}</span>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
                
                {/* Translation Hint */}
                <div className="mb-12 text-center">
                    <span className="text-xs uppercase text-purple-300/50 font-bold tracking-[0.2em] mb-2 block">Translate this</span>
                    <h2 className="text-3xl font-bold text-purple-100 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                        {currentTranslation}
                    </h2>
                </div>

                {/* Selected Letters (The Word) */}
                <div className={`flex flex-wrap justify-center gap-2 mb-12 min-h-[60px] ${shake ? 'animate-shake' : ''}`}>
                    {selectedLetters.map((letter, index) => (
                        <motion.button
                            layoutId={`letter-${letter.id}`}
                            key={letter.id}
                            onClick={() => handleLetterDeselect(letter)}
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] border border-white/20"
                        >
                            {letter.char}
                        </motion.button>
                    ))}
                    {/* Placeholders */}
                    {[...Array(Math.max(0, currentWord.length - selectedLetters.length))].map((_, i) => (
                        <div key={`placeholder-${i}`} className="w-12 h-12 rounded-xl bg-white/5 border-2 border-dashed border-white/10"></div>
                    ))}
                </div>

                {/* Scrambled Letters Pool */}
                <div className="flex flex-wrap justify-center gap-3 max-w-xs">
                    <AnimatePresence>
                        {scrambledLetters.map((letter) => (
                            <motion.button
                                layoutId={`letter-${letter.id}`}
                                key={letter.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={() => handleLetterSelect(letter)}
                                className="w-14 h-14 rounded-full bg-slate-800 border-2 border-purple-500/30 flex items-center justify-center text-2xl font-bold text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)] active:scale-95 transition-transform hover:bg-slate-700"
                            >
                                {letter.char}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>

            </div>
        </div>
      );
  }

  return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-[#050b14] relative">
          <div className="glass-card w-full max-w-sm p-8 rounded-3xl flex flex-col items-center text-center border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg">
                  <Flag className="text-5xl text-white" />
              </div>

              <h2 className="text-3xl font-black text-white mb-2">TIME'S UP!</h2>
              <p className="text-purple-300 mb-8">Koinot sayohatingiz yakunlandi.</p>

              <div className="flex flex-col items-center mb-8 w-full bg-white/5 rounded-2xl p-4">
                  <span className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">Total Score</span>
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{score}</span>
              </div>

              <button 
                onClick={() => setPhase('menu')}
                className="w-full py-4 rounded-xl bg-white/10 font-bold text-white hover:bg-white/20 transition mb-3"
              >
                Qayta O'ynash
              </button>
              <button 
                onClick={onBack} 
                className="text-sm text-gray-500 hover:text-white transition"
              >
                O'yinlar Menyusiga Qaytish
              </button>
          </div>
      </div>
  );
};

export default CosmicScramble;
