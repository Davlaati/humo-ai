import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import WordBattle from './WordBattle';
import CosmicScramble from './CosmicScramble';
import WordChain from './WordChain';
import GuessingGame from './GuessingGame';
import { playTapSound } from '../services/audioService';
import { Gamepad2, Shield, Star, Rocket, Zap, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameProps {
  user: UserProfile;
  onUpdateUser?: (user: UserProfile) => void;
}

type ActiveGame = 'menu' | 'word-battle' | 'cosmic-scramble' | 'word-chain' | 'guessing-game';

const GAMES_DATA = [
  {
    id: 'word-battle',
    title: "SO'Z JANGI",
    description: "Sun'iy intellektga qarshi tezkor tarjima bellashuvi. Kim tezroq?",
    icon: Shield,
    badge: "Popular",
    bgGradient: "from-blue-600 to-indigo-800"
  },
  {
    id: 'cosmic-scramble',
    title: "COSMIC SCRAMBLE",
    description: "Koinot bo'ylab sayohat qiling va so'zlarni yig'ing.",
    icon: Rocket,
    badge: "New",
    bgGradient: "from-purple-600 to-slate-900"
  },
  {
    id: 'word-chain',
    title: "SO'Z ZANJIRI",
    description: "Do'stlaringiz bilan so'z zanjirini davom ettiring!",
    icon: Zap,
    bgGradient: "from-yellow-600 to-amber-800"
  },
  {
    id: 'guessing-game',
    title: "TOPISHMOQ",
    description: "Do'stlaringiz bilan so'zlarni toping!",
    icon: MessageSquare,
    bgGradient: "from-green-600 to-emerald-800"
  }
];

const Game: React.FC<GameProps> = ({ user, onUpdateUser }) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>('menu');
  const [gameList, setGameList] = useState(GAMES_DATA);
  const [playersCount, setPlayersCount] = useState<Record<string, number>>({
    'word-battle': 1245,
    'cosmic-scramble': 832,
    'word-chain': 3420,
    'guessing-game': 2105
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayersCount(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
          next[key] = Math.max(10, next[key] + change);
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold || info.offset.x > swipeThreshold) {
      playTapSound();
      setGameList((prev) => {
        const newArr = [...prev];
        const top = newArr.shift();
        if (top) newArr.push(top);
        return newArr;
      });
    } else if (info.offset.y > swipeThreshold) {
      playTapSound();
      setActiveGame(gameList[0].id as ActiveGame);
    }
  };

  if (activeGame === 'word-battle') {
    return <WordBattle user={user} onUpdateUser={onUpdateUser} onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'cosmic-scramble') {
    return <CosmicScramble user={user} onUpdateUser={onUpdateUser} onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'word-chain') {
    return <WordChain user={user} onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'guessing-game') {
    return <GuessingGame user={user} onBack={() => setActiveGame('menu')} />;
  }

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in relative overflow-hidden bg-gradient-to-b from-[#0c1222] to-[#1a233a]">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full pb-24">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">O'YINLAR</h1>
            <p className="text-blue-200/70 text-sm font-medium">Bilimingizni sinab ko'ring</p>
          </div>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Gamepad2 className="text-white w-6 h-6" />
          </div>
        </header>

        <div className="flex-1 relative flex items-center justify-center">
          <div className="relative w-full aspect-[3/4] max-w-sm mx-auto">
            <AnimatePresence>
              {gameList.map((game, index) => {
                const isTop = index === 0;
                return (
                  <motion.div
                    key={game.id}
                    className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden border border-white/20 shadow-2xl backdrop-blur-xl bg-white/10"
                    style={{
                      zIndex: gameList.length - index,
                      transformOrigin: "bottom center"
                    }}
                    initial={{ scale: 0.8, y: 50, opacity: 0 }}
                    animate={{
                      scale: 1 - index * 0.05,
                      y: index * -20,
                      opacity: 1 - index * 0.2,
                    }}
                    drag={isTop ? "x" : false}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    onDragEnd={isTop ? handleDragEnd : undefined}
                    whileTap={isTop ? { cursor: "grabbing" } : {}}
                  >
                    {/* Card Content */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.bgGradient} opacity-50 mix-blend-overlay`}></div>
                    
                    <div className="relative h-full flex flex-col p-6">
                      {/* Top section: Badge & Live Counter */}
                      <div className="flex justify-between items-start">
                        {game.badge ? (
                          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400" /> {game.badge}
                            </span>
                          </div>
                        ) : <div></div>}
                        
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
                          <span className="text-xs font-bold text-green-400">
                            {playersCount[game.id].toLocaleString()} kishi
                          </span>
                        </div>
                      </div>

                      {/* Center Icon */}
                      <div className="flex-1 flex items-center justify-center pointer-events-none">
                        <div className={`w-32 h-32 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]`}>
                          <game.icon className="w-16 h-16 text-white drop-shadow-lg" />
                        </div>
                      </div>

                      {/* Bottom Info */}
                      <div className="mt-auto">
                        <h2 className="text-3xl font-black text-white italic tracking-tight mb-2 drop-shadow-md">
                          {game.title}
                        </h2>
                        <p className="text-white/80 text-sm font-medium mb-6 line-clamp-2">
                          {game.description}
                        </p>
                        
                        <button 
                          onClick={() => {
                            playTapSound();
                            setActiveGame(game.id as ActiveGame);
                          }}
                          className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                        >
                          O'ynash
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Swipe Instructions */}
          <div className="absolute bottom-0 w-full text-center pb-4 pointer-events-none">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <span>←</span> O'tkazish uchun suring <span>→</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;