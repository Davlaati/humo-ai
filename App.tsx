
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, EntryNotification as EntryNotifType, EnglishLevel } from './types';
import { incrementActiveTime, getEntryNotification } from './services/storageService';
import { useUserSync } from './hooks/useUserSync';
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
import Translator from './components/Translator';

const Pricing = React.lazy(() => import('./components/Pricing'));
const Checkout = React.lazy(() => import('./components/Checkout'));
const Paywall = React.lazy(() => import('./components/Paywall'));

const App: React.FC = () => {
  const { user, loading: userLoading, updateUser } = useUserSync();
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [streakReward, setStreakReward] = useState<{days: number, coins: number} | null>(null);

  const [entryNotif, setEntryNotif] = useState<EntryNotifType | null>(null);
  const [showEntryNotif, setShowEntryNotif] = useState(false);
  const [isAppRevealed, setIsAppRevealed] = useState(false);
  const [isInitialSplash, setIsInitialSplash] = useState(true);

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

    // Initial Splashdan chiqish va xabarnomani ko'rsatish
    // Faqat bir marta ishga tushiramiz yoki user yuklangandan keyin
    const timer = setTimeout(() => {
      setIsInitialSplash(false); 
      
      const activeNotif = getEntryNotification();
      if (activeNotif && activeNotif.isActive && user) {
          let shouldShow = false;
          if (activeNotif.target === 'all') shouldShow = true;
          else if (activeNotif.target === 'has_coins' && (user.coins || 0) > 0) shouldShow = true;
          else if (activeNotif.target === 'no_coins' && (user.coins || 0) === 0) shouldShow = true;

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
  }, [user === null]); // Only re-run if user goes from null to something or vice versa

  useEffect(() => {
    if (!user) return;
    activityIntervalRef.current = setInterval(() => {
      const updatedUser = incrementActiveTime(1);
      if (updatedUser) {
        // Local update
      }
    }, 1000);
    return () => {
      if (activityIntervalRef.current) clearInterval(activityIntervalRef.current);
    }
  }, [user?.id]);

  const handleOnboardingComplete = (onboardingData: Partial<UserProfile>) => {
    const updatedUser = { 
      ...user,
      ...onboardingData, 
      isOnboarded: true,
      streak: 1,
      coins: (user?.coins || 500) + 20,
      settings: {
        ...user?.settings,
        ...onboardingData.settings,
        isOnboarded: true
      }
    } as UserProfile;
    updateUser(updatedUser);
    setIsAppRevealed(true);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
      updateUser(updatedUser);
  };

  if (user && !user.isOnboarded && !isInitialSplash && !userLoading) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!user && !isInitialSplash && !userLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0c1222]">
         <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Foydalanuvchi aniqlanmadi</p>
      </div>
    );
  }

  if (userLoading && !isInitialSplash) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0c1222]">
         <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (isInitialSplash) {
      return (
          <div className="fixed inset-0 bg-[#0f172a] z-[5000] flex flex-col items-center justify-center">
              <div className="relative flex flex-col items-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-30 animate-pulse"></div>
                  {/* LOGO INTEGRATION */}
                  <img 
                    src="./logo.png" 
                    alt="Ravona AI" 
                    className="w-56 h-auto relative z-10 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] animate-pulse" 
                    onError={(e) => {
                      // Fallback if image not found
                      e.currentTarget.style.display = 'none';
                      const fallback = document.getElementById('splash-fallback');
                      if(fallback) fallback.style.display = 'block';
                    }}
                  />
                  {/* Fallback Text just in case */}
                  <h1 id="splash-fallback" className="hidden mt-4 text-4xl font-black italic tracking-tighter text-white opacity-80 uppercase">Ravona AI</h1>
              </div>
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
          case 'speaking-club': return <SpeakingClub user={user} onNavigate={setActiveTab} onUpdateUser={handleUpdateUser} onShowPaywall={() => setShowPaywall(true)} />;
          case 'leaderboard': return <Leaderboard user={user} onNavigate={setActiveTab} />;
          case 'profile': return <Profile user={user} onUpdateUser={handleUpdateUser} onShowAdmin={() => setIsAdminMode(true)} onShowPremium={() => setActiveTab('pricing')} />;
          case 'dictionary': return <SmartDictionary user={user} onUpdateUser={handleUpdateUser} />;
          case 'translator': return <Translator user={user} onNavigate={setActiveTab} onShowPaywall={() => setShowPaywall(true)} />;
          case 'pricing': {
            return (
              <React.Suspense fallback={<div>Loading...</div>}>
                <Pricing onSelectPlan={(plan) => {
                  setSelectedPlan(plan);
                  setActiveTab('checkout');
                }} onBack={() => setActiveTab('home')} />
              </React.Suspense>
            );
          }
          case 'checkout': {
            return (
              <React.Suspense fallback={<div>Loading...</div>}>
                <Checkout 
                  user={user} 
                  plan={selectedPlan} 
                  onSuccess={(updatedUser) => {
                    handleUpdateUser(updatedUser);
                    setActiveTab('home');
                  }} 
                  onBack={() => setActiveTab('pricing')} 
                />
              </React.Suspense>
            );
          }
          default: return <Home user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />;
      }
  };

  return (
    <>
       {showEntryNotif && entryNotif && (
           <div className="fixed inset-0 z-[4000] bg-blue-900/50 backdrop-blur-sm animate-fade-in">
                <EntryNotification 
                  notification={entryNotif} 
                  onClose={() => {
                      setShowEntryNotif(false);
                      setIsAppRevealed(true);
                  }} 
                  onNavigate={setActiveTab}
                />
           </div>
       )}

       <div className={`h-full w-full transition-all duration-1000 ${isAppRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-xl pointer-events-none'}`}>
           {showPaywall && (
             <React.Suspense fallback={null}>
               <Paywall 
                 user={user!} 
                 onActivate={() => {
                   setShowPaywall(false);
                   setActiveTab('pricing');
                 }} 
                 onClose={() => setShowPaywall(false)} 
               />
             </React.Suspense>
           )}
           {activeTab === 'wallet' ? (
               <Layout activeTab="home" onTabChange={setActiveTab} showNav={false}>
                   <Wallet user={user!} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />
               </Layout>
           ) : (
               <Layout activeTab={activeTab} onTabChange={(tab) => {
                   if (tab === 'home' && activeTab === 'home') setActiveTab('wallet');
                   else setActiveTab(tab);
               }} showNav={true}> 
                 {renderContent()}
               </Layout>
           )}
       </div>
    </>
  );
};

export default App;
