import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { saveUser } from '../services/storageService';
import { DICTIONARY } from '../data/dictionary';
import { playTapSound } from '../services/audioService';

interface GameProps {
  user: UserProfile;
}

type GamePhase = 'menu' | 'searching' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard';

// Helper to shuffle array
const shuffle = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
};

// Helper to generate a question based on difficulty
const generateQuestion = (difficulty: Difficulty) => {
    let filteredDictionary = DICTIONARY;
    
    // Filter by word length as a proxy for complexity
    if (difficulty === 'easy') {
        filteredDictionary = DICTIONARY.filter(w => w.term.length <= 5);
    } else if (difficulty === 'hard') {
        filteredDictionary = DICTIONARY.filter(w => w.term.length >= 7);
    }

    if (filteredDictionary.length === 0) filteredDictionary = DICTIONARY;

    const randomIndex = Math.floor(Math.random() * filteredDictionary.length);
    const targetWord = filteredDictionary[randomIndex];
    
    // Pick 3 random distractors from the full dictionary for variety
    const distractors = new Set<string>();
    while(distractors.size < 3) {
        const dIndex = Math.floor(Math.random() * DICTIONARY.length);
        if (DICTIONARY[dIndex].term !== targetWord.term) {
            distractors.add(DICTIONARY[dIndex].translation);
        }
    }

    const options = shuffle([targetWord.translation, ...Array.from(distractors)]);
    const correctIndex = options.indexOf(targetWord.translation);

    return {
        word: targetWord.term,
        options: options,
        correct: correctIndex
    };
};

const Game: React.FC<GameProps> = ({ user }) => {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timeLeft, setTimeLeft] = useState(60);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [currentQData, setCurrentQData] = useState<ReturnType<typeof generateQuestion> | null>(null);
  const [botStatus, setBotStatus] = useState<'thinking' | 'answered'>('thinking');
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | 'too_slow' | null>(null);
  
  // Game Loop Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  const startGame = () => {
    playTapSound();
    setPhase('searching');
    setTimeout(() => {
      setPhase('playing');
      resetRound();
      startMainTimer();
    }, 2500); // Fake matchmaking time
  };

  const startMainTimer = () => {
    setTimeLeft(60);
    setPlayerScore(0);
    setBotScore(0);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setPhase('result');
    
    // Reward logic based on difficulty
    if (playerScore > botScore) {
       const bonusCoins = difficulty === 'easy' ? 25 : difficulty === 'medium' ? 50 : 100;
       const bonusXP = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 40;

       const newUser = { 
           ...user, 
           coins: user.coins + bonusCoins, 
           xp: user.xp + bonusXP,
           wins: (user.wins || 0) + 1 
       };
       saveUser(newUser);
    }
  };

  const nextRound = () => {
    resetRound();
  };

  const resetRound = () => {
    const newQ = generateQuestion(difficulty);
    setCurrentQData(newQ);

    setBotStatus('thinking');
    setLastResult(null);
    
    // Bot reaction time based on difficulty
    let botDelay = 0;
    if (difficulty === 'easy') {
        botDelay = Math.random() * 2000 + 4000; // 4-6 seconds
    } else if (difficulty === 'medium') {
        botDelay = Math.random() * 1500 + 2000; // 2-3.5 seconds
    } else {
        botDelay = Math.random() * 800 + 1200; // 1.2-2.0 seconds
    }
    
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    botTimerRef.current = setTimeout(() => {
        setBotScore(s => s + 1);
        setBotStatus('answered');
        setLastResult('too_slow');
        setTimeout(nextRound, 1000);
    }, botDelay);
  };

  const handleAnswer = (index: number) => {
    if (!currentQData) return;
    if (botStatus === 'answered' || lastResult) return;

    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    const correct = currentQData.correct;
    if (index === correct) {
        setPlayerScore(s => s + 1);
        setLastResult('correct');
        playTapSound();
    } else {
        setLastResult('wrong');
    }

    setBotStatus('answered'); 
    setTimeout(nextRound, 1000);
  };

  if (phase === 'menu') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
        <div className="absolute top-10 left-[-20px] w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-[-20px] w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

        <div className="glass-card w-full max-w-sm p-8 rounded-3xl flex flex-col items-center text-center border-2 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
           <div className="mb-6 relative">
              <i className="fa-solid fa-khanda text-7xl text-yellow-400 drop-shadow-lg transform rotate-[-15deg]"></i>
              <i className="fa-solid fa-shield-halved text-7xl text-blue-400 drop-shadow-lg absolute top-0 left-8 transform rotate-[15deg]"></i>
           </div>
           
           <h1 className="text-4xl font-black italic mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
             SO'Z JANGI
           </h1>
           <p className="text-gray-300 mb-8 font-medium">Tezkor tarjimada AI bilan bellashing!</p>

           <div className="w-full mb-8">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Darajani tanlang</p>
              <div className="flex space-x-2">
                 <button 
                   onClick={() => { playTapSound(); setDifficulty('easy'); }}
                   className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all border ${difficulty === 'easy' ? 'bg-green-500 text-white border-green-400 shadow-lg shadow-green-500/20' : 'bg-white/5 text-gray-500 border-white/5'}`}
                 >
                   Oson
                 </button>
                 <button 
                   onClick={() => { playTapSound(); setDifficulty('medium'); }}
                   className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all border ${difficulty === 'medium' ? 'bg-yellow-500 text-white border-yellow-400 shadow-lg shadow-yellow-500/20' : 'bg-white/5 text-gray-500 border-white/5'}`}
                 >
                   O'rta
                 </button>
                 <button 
                   onClick={() => { playTapSound(); setDifficulty('hard'); }}
                   className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all border ${difficulty === 'hard' ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-500 border-white/5'}`}
                 >
                   Qiyin
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                 <p className="text-xs text-gray-400">Sovrin</p>
                 <p className="text-yellow-400 font-bold">
                    <i className="fa-solid fa-coins mr-1"></i> 
                    {difficulty === 'easy' ? '25' : difficulty === 'medium' ? '50' : '100'}
                 </p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                 <p className="text-xs text-gray-400">Vaqt</p>
                 <p className="text-blue-400 font-bold"><i className="fa-regular fa-clock mr-1"></i> 60s</p>
              </div>
           </div>

           <button 
             onClick={startGame}
             className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 font-black text-xl shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 transition-all text-white uppercase tracking-wider"
           >
             Raqib Izlash
           </button>
        </div>
      </div>
    );
  }

  if (phase === 'searching') {
    return (
       <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="relative w-32 h-32 mb-8">
             <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-t-yellow-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">⚔️</span>
             </div>
          </div>
          <h2 className="text-xl font-bold animate-pulse">Raqib qidirilmoqda...</h2>
          <div className="mt-2 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">{difficulty} MODI</div>
          <div className="mt-8 flex items-center space-x-4 opacity-50">
             <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg">{user.name.charAt(0)}</div>
             <span className="font-bold text-sm">VS</span>
             <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse"></div>
          </div>
       </div>
    );
  }

  if (phase === 'playing' && currentQData) {
      return (
        <div className="h-full p-4 flex flex-col pb-24 animate-slide-up">
           <div className="flex justify-between items-center bg-slate-800/80 p-3 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
              <div className="flex items-center space-x-3 z-10">
                 <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg">
                    {user.name.charAt(0)}
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-blue-300">SIZ</p>
                    <p className="text-2xl font-black leading-none">{playerScore}</p>
                 </div>
              </div>

              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                 <div className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {timeLeft}
                 </div>
                 <div className="text-[8px] text-gray-400 uppercase tracking-widest">{difficulty}</div>
              </div>

              <div className="flex items-center space-x-3 flex-row-reverse space-x-reverse z-10">
                 <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg relative">
                    🤖
                    {botStatus === 'answered' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-slate-900"></div>}
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-red-300">BOT</p>
                    <p className="text-2xl font-black leading-none">{botScore}</p>
                 </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col justify-center items-center py-6 relative">
              {lastResult === 'correct' && (
                  <div className="absolute z-50 text-4xl font-black text-green-400 animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      NICE!
                  </div>
              )}
              {lastResult === 'wrong' && (
                  <div className="absolute z-50 text-4xl font-black text-red-500 animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      WRONG!
                  </div>
              )}
              {lastResult === 'too_slow' && (
                  <div className="absolute z-50 text-4xl font-black text-gray-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      SEKIN!
                  </div>
              )}

              <div className="w-full glass-card rounded-3xl p-8 flex flex-col items-center justify-center border-b-4 border-blue-600/50 mb-6 relative">
                  <span className="text-xs uppercase font-bold text-gray-400 mb-2 tracking-widest">Tarjima Qiling</span>
                  <h2 className="text-4xl font-black text-center drop-shadow-lg break-all">{currentQData.word}</h2>
                  {botStatus === 'thinking' && (
                      <div className="absolute -bottom-3 bg-slate-800 px-3 py-1 rounded-full text-[10px] text-gray-400 flex items-center space-x-1 border border-white/10">
                          <span>Bot o'ylamoqda</span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                  {currentQData.options.map((opt, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={!!lastResult}
                        className={`
                            py-6 rounded-2xl font-bold text-lg shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all
                            ${lastResult && idx === currentQData.correct ? 'bg-green-500 text-white' : ''}
                            ${lastResult === 'wrong' && idx !== currentQData.correct ? 'opacity-50' : ''}
                            ${!lastResult ? 'bg-white text-slate-900 hover:bg-gray-100' : 'bg-slate-700 text-gray-400'}
                        `}
                      >
                          {opt}
                      </button>
                  ))}
              </div>
           </div>
        </div>
      );
  }

  const won = playerScore > botScore;
  return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
               {won && <div className="absolute top-1/4 left-1/4 w-2 bg-yellow-400 h-2 rounded-full animate-ping"></div>}
               {won && <div className="absolute top-1/3 right-1/4 w-3 bg-blue-400 h-3 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>}
          </div>

          <div className="glass-card w-full max-w-sm p-8 rounded-3xl flex flex-col items-center text-center border-t border-white/20">
              <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 relative">
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${won ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <i className={`fa-solid ${won ? 'fa-trophy text-yellow-400' : 'fa-skull text-gray-400'} text-6xl relative z-10 drop-shadow-lg`}></i>
              </div>

              <h2 className="text-3xl font-black mb-1">{won ? "G'ALABA!" : "MAG'LUBIYAT"}</h2>
              <p className="text-gray-400 mb-1">{won ? "Siz botni yengdingiz!" : "Bu safar bot tezroq chiqdi."}</p>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{difficulty} DARAJA</p>

              <div className="flex justify-center space-x-8 mb-8 w-full">
                  <div className="flex flex-col items-center">
                      <span className="text-gray-400 text-xs uppercase font-bold">Siz</span>
                      <span className="text-3xl font-black text-blue-400">{playerScore}</span>
                  </div>
                  <div className="flex flex-col items-center">
                      <span className="text-gray-400 text-xs uppercase font-bold">Bot</span>
                      <span className="text-3xl font-black text-red-400">{botScore}</span>
                  </div>
              </div>

              {won && (
                  <div className="bg-yellow-500/20 text-yellow-300 px-6 py-3 rounded-xl font-bold mb-8 animate-bounce">
                      +{difficulty === 'easy' ? '25' : difficulty === 'medium' ? '50' : '100'} HC Ishlandi
                  </div>
              )}

              <button 
                onClick={() => setPhase('menu')}
                className="w-full py-4 rounded-xl glass-panel font-bold hover:bg-white/10 transition mb-3"
              >
                Qayta O'ynash
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="text-sm text-gray-400 hover:text-white"
              >
                Bosh Sahifaga Qaytish
              </button>
          </div>
      </div>
  );
};

export default Game;