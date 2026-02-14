
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, EntryNotification as EntryNotifType } from './types';
import { getUser, saveUser, incrementActiveTime, getEntryNotification } from './services/storageService';
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
import EntryNotification from './components/EntryNotification';
import SmartDictionary from './components/SmartDictionary';
import { fetchLoadingLogo } from './services/publicApiService';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [streakReward, setStreakReward] = useState<{days: number, coins: number} | null>(null);

  const [entryNotif, setEntryNotif] = useState<EntryNotifType | null>(null);
  const [showEntryNotif, setShowEntryNotif] = useState(false);
  const [isAppRevealed, setIsAppRevealed] = useState(false);
  const [isInitialSplash, setIsInitialSplash] = useState(true);
  const [loadingLogoUrl, setLoadingLogoUrl] = useState<string | null>(null);

  const activityIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Telegram WebApp initializatsiya
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      try {
        tg.expand();
      } catch (e) { console.warn("Telegram expand fail:", e); }
      tg.enableClosingConfirmation();
    }

    fetchLoadingLogo().then((r) => {
      if (r?.success && r.imageUrl) setLoadingLogoUrl(r.imageUrl);
    }).catch(() => {});

    // Foydalanuvchini yuklash
    const storedUser = getUser();
    if (storedUser) setUser(storedUser);

    // Initial Splashdan chiqish va xabarnomani ko'rsatish
    const timer = setTimeout(() => {
      const activeNotif = getEntryNotification();
      const currentUser = getUser();
      
      setIsInitialSplash(false); 

      if (activeNotif && activeNotif.isActive && currentUser) {
          let shouldShow = false;
          if (activeNotif.target === 'all') shouldShow = true;
          else if (activeNotif.target === 'has_coins' && (currentUser.coins || 0) > 0) shouldShow = true;
          else if (activeNotif.target === 'no_coins' && (currentUser.coins || 0) === 0) shouldShow = true;

          if (shouldShow) {
            setEntryNotif(activeNotif);
            setShowEntryNotif(true);
          } else {
            setIsAppRevealed(true);
          }
      } else {
          setIsAppRevealed(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    activityIntervalRef.current = setInterval(() => {
      const updatedUser = incrementActiveTime(1);
      if (updatedUser) {
        setUser(prev => prev ? { ...prev, activeSecondsToday: updatedUser.activeSecondsToday } : null);
      }
    }, 1000);
    return () => {
      if (activityIntervalRef.current) clearInterval(activityIntervalRef.current);
    }
  }, [user?.id]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    const newUser = { 
      ...profile, 
      id: Date.now().toString(),
      streak: 1,
      coins: (profile.coins || 0) + 20 
    };
    saveUser(newUser);
    setUser(newUser);
    setIsAppRevealed(true);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
      saveUser(updatedUser);
      setUser(updatedUser);
  };

  if (!user && !isInitialSplash) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (isInitialSplash) {
      return (
          <div className="fixed inset-0 bg-[#0f172a] z-[5000] flex flex-col items-center justify-center">
              <div className="relative">
                  <div className="w-24 h-24 bg-blue-500 rounded-full blur-[60px] opacity-40 animate-pulse"></div>
                  {loadingLogoUrl ? (
                    <img src={loadingLogoUrl} alt="Loading Logo" className="w-16 h-16 object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
                  ) : (
                    <i className="fa-solid fa-feather-pointed text-6xl text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]"></i>
                  )}
              </div>
              <h1 className="mt-8 text-2xl font-black italic tracking-tighter text-white opacity-80 uppercase">Humo AI</h1>
          </div>
      );
  }

  if (isAdminMode) {
      return (
          <div className="h-full bg-slate-900 text-white relative">
              <button onClick={() => setIsAdminMode(false)} className="absolute top-4 right-4 text-xs bg-red-500 px-3 py-1.5 rounded-full font-bold z-[2000]">Exit Admin</button>
              <Admin />
          </div>
      )
  }

  const renderContent = () => {
      if (!user) return null;
      switch (activeTab) {
          case 'home': return <Home user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} streakReward={streakReward} onClearStreakReward={() => setStreakReward(null)} />;
          case 'learn': return <Lesson user={user} onUpdateUser={handleUpdateUser} />;
          case 'wordbank': return <WordBank user={user} onUpdateUser={handleUpdateUser} />;
          case 'game': return <Game user={user} />;
          case 'speaking-club': return <SpeakingClub user={user} onNavigate={setActiveTab} onUpdateUser={handleUpdateUser} />;
          case 'leaderboard': return <Leaderboard user={user} onNavigate={setActiveTab} />;
          case 'profile': return <Profile user={user} onUpdateUser={handleUpdateUser} />;
          case 'dictionary': return <SmartDictionary user={user} />;
          default: return <Home user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />;
      }
  };

  return (
    <>
       <div onDoubleClick={() => setIsAdminMode(true)} className="fixed top-0 left-0 w-12 h-12 z-[3000] opacity-0"></div>
       
       {showEntryNotif && entryNotif && (
           <div className="fixed inset-0 z-[4000] bg-blue-900/50 backdrop-blur-sm animate-fade-in">
                <EntryNotification 
                  notification={entryNotif} 
                  onClose={() => {
                      setShowEntryNotif(false);
                      setIsAppRevealed(true);
                  }} 
                />
           </div>
       )}

       <div className={`h-full w-full transition-all duration-1000 ${isAppRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-xl pointer-events-none'}`}>
           {activeTab === 'wallet' ? (
               <Layout activeTab="home" onTabChange={setActiveTab} showNav={false}>
                   <Wallet user={user!} />
               </Layout>
           ) : (
               <Layout activeTab={activeTab === 'speaking-club' ? 'home' : activeTab} onTabChange={(tab) => {
                   if (tab === 'home' && activeTab === 'home') setActiveTab('wallet');
                   else setActiveTab(tab);
               }} showNav={activeTab !== 'speaking-club'}> 
                 {renderContent()}
               </Layout>
           )}
       </div>
    </>
  );
};

export default App;
