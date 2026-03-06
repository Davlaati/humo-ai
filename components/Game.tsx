import React, { useState } from 'react';
import { UserProfile } from '../types';
import WordBattle from './WordBattle';
import CosmicScramble from './CosmicScramble';
import WordChain from './WordChain';
import GuessingGame from './GuessingGame';
import { playTapSound } from '../services/audioService';
import { Gamepad2, Flame, Shield, Star, Rocket, Zap, MessageSquare } from 'lucide-react';

interface GameProps {
  user: UserProfile;
}

type ActiveGame = 'menu' | 'word-battle' | 'cosmic-scramble' | 'word-chain' | 'guessing-game';

const Game: React.FC<GameProps> = ({ user }) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>('menu');

  if (activeGame === 'word-battle') {
    return <WordBattle user={user} onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'cosmic-scramble') {
    return <CosmicScramble user={user} onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'word-chain') {
    return <WordChain user={user} onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'guessing-game') {
    return <GuessingGame user={user} onBack={() => setActiveGame('menu')} />;
  }

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in relative overflow-hidden bg-[#0c1222]">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter">O'YINLAR</h1>
            <p className="text-gray-400 text-sm font-medium">Bilimingizni sinab ko'ring</p>
          </div>
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shadow-lg">
            <Gamepad2 className="text-blue-400 w-5 h-5" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-20 space-y-6 no-scrollbar">
          
          {/* Game Card 1: Word Battle */}
          <div 
            onClick={() => { playTapSound(); setActiveGame('word-battle'); }}
            className="group relative w-full aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer transform transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614726365723-49cfae963956?w=800&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
            
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                <Flame className="text-orange-400 w-3 h-3" /> Popular
              </span>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tight">SO'Z JANGI</h2>
              </div>
              <p className="text-blue-100/80 text-sm font-medium line-clamp-2">
                Sun'iy intellektga qarshi tezkor tarjima bellashuvi. Kim tezroq?
              </p>
            </div>
          </div>

          {/* Game Card 2: Cosmic Scramble */}
          <div 
            onClick={() => { playTapSound(); setActiveGame('cosmic-scramble'); }}
            className="group relative w-full aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer transform transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] border-2 border-purple-500/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-slate-900"></div>
            {/* Stars effect */}
            <div className="absolute inset-0 opacity-50">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="absolute bg-white rounded-full animate-pulse" style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 2 + 1}px`,
                        height: `${Math.random() * 2 + 1}px`
                    }}></div>
                ))}
            </div>
            
            <div className="absolute top-4 right-4 bg-purple-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-purple-400/30 animate-pulse">
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1">
                <Star className="text-yellow-400 w-3 h-3" /> New
              </span>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Rocket className="text-white w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tight">COSMIC SCRAMBLE</h2>
              </div>
              <p className="text-purple-200/80 text-sm font-medium line-clamp-2">
                Koinot bo'ylab sayohat qiling va so'zlarni yig'ing.
              </p>
            </div>
          </div>

          {/* Game Card 3: Word Chain */}
          <div 
            onClick={() => { playTapSound(); setActiveGame('word-chain'); }}
            className="group relative w-full aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer transform transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] border-2 border-yellow-500/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-amber-800"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tight">SO'Z ZANJIRI</h2>
              </div>
              <p className="text-yellow-100/80 text-sm font-medium line-clamp-2">
                Do'stlaringiz bilan so'z zanjirini davom ettiring!
              </p>
            </div>
          </div>

          {/* Game Card 4: Guessing Game */}
          <div 
            onClick={() => { playTapSound(); setActiveGame('guessing-game'); }}
            className="group relative w-full aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer transform transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] border-2 border-green-500/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-800"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <MessageSquare className="text-white w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tight">TOPISHMOQ</h2>
              </div>
              <p className="text-green-100/80 text-sm font-medium line-clamp-2">
                Do'stlaringiz bilan so'zlarni toping!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;