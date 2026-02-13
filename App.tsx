
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { getUser, saveUser, getEntryNotification } from './services/storageService';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import Home from './components/Home';
import Lesson from './components/Lesson';
import Profile from './components/Profile';
import Wallet from './components/Wallet';
import Admin from './components/Admin';
import Game from './components/Game';
import WordBank from './components/WordBank';
import SpeakingClub from './components/SpeakingClub';
import Leaderboard from './components/Leaderboard';
import LuckWheel from './components/LuckWheel';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isInitialSplash, setIsInitialSplash] = useState(true);
  const [showAutoWheel, setShowAutoWheel] = useState(false);
  const [isAppRevealed, setIsAppRevealed] = useState(false);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); }
    
    const stored = getUser();
    if (stored) {
        setUser(stored);
        // Applying initial theme
        if(stored.settings?.theme === 'light') document.documentElement.classList.add('light-mode');
    }

    const timer = setTimeout(() => {
      setIsInitialSplash(false);
      if (stored) setShowAutoWheel(true);
      else setIsAppRevealed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleUpdateUser = (updated: UserProfile) => {
    saveUser(updated);
    setUser(updated);
  };

  if (!user && !isInitialSplash) return <Onboarding onComplete={u => { saveUser(u); setUser(u); setIsAppRevealed(true); }} />;

  if (isInitialSplash) return (
    <div className="fixed inset-0 bg-[#0f172a] z-[5000] flex flex-col items-center justify-center animate-fade-in">
        <div className="w-24 h-24 bg-blue-500 rounded-full blur-[60px] opacity-40 animate-pulse"></div>
        <i className="fa-solid fa-feather-pointed text-6xl text-blue-400 absolute"></i>
        <h1 className="mt-20 text-xl font-black italic text-white/50 tracking-widest uppercase">Humo AI</h1>
    </div>
  );

  return (
    <>
       <div onDoubleClick={() => setIsAdminMode(true)} className="fixed top-0 left-0 w-12 h-12 z-[11000] opacity-0"></div>
       
       {showAutoWheel && user && (
           <LuckWheel user={user} onUpdateUser={handleUpdateUser} onClose={() => { setShowAutoWheel(false); setIsAppRevealed(true); }} />
       )}

       <div className={`h-full w-full transition-all duration-1000 ${isAppRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-2xl pointer-events-none'}`}>
          {isAdminMode ? (
              <div className="h-full bg-slate-950 relative">
                  <button onClick={() => setIsAdminMode(false)} className="absolute top-4 right-4 bg-red-500 px-3 py-1 rounded-full font-bold z-[12000] text-[10px]">EXIT ADMIN</button>
                  <Admin />
              </div>
          ) : (
              <Layout activeTab={activeTab} onTabChange={setActiveTab}> 
                {(() => {
                    switch (activeTab) {
                        case 'home': return <Home user={user!} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />;
                        case 'learn': return <Lesson user={user!} onUpdateUser={handleUpdateUser} />;
                        case 'wordbank': return <WordBank user={user!} onUpdateUser={handleUpdateUser} />;
                        case 'game': return <Game user={user!} />;
                        case 'speaking-club': return <SpeakingClub user={user!} onNavigate={setActiveTab} onUpdateUser={handleUpdateUser} />;
                        case 'leaderboard': return <Leaderboard user={user!} onNavigate={setActiveTab} />;
                        case 'profile': return <Profile user={user!} onUpdateUser={handleUpdateUser} />;
                        case 'wallet': return <Wallet user={user!} />;
                        default: return <Home user={user!} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />;
                    }
                })()}
              </Layout>
          )}
       </div>
    </>
  );
};

export default App;
