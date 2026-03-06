
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
import RavonaMock from './components/RavonaMock';
import Leaderboard from './components/Leaderboard';
import EntryNotification from './components/EntryNotification';
import SmartDictionary from './components/SmartDictionary';
import GrammarAnalyzer from './components/GrammarAnalyzer';
import Library from './components/Library';
import UserProfileView from './components/UserProfileView';

const Pricing = React.lazy(() => import('./components/Pricing'));
const Checkout = React.lazy(() => import('./components/Checkout'));
const Paywall = React.lazy(() => import('./components/Paywall'));

const App: React.FC = () => {
  const { user, loading: userLoading, error: userError, updateUser, refresh: refreshUser } = useUserSync();
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [streakReward, setStreakReward] = useState<{days: number, coins: number} | null>(null);

  const [entryNotif, setEntryNotif] = useState<EntryNotifType | null>(null);
  const [showEntryNotif, setShowEntryNotif] = useState(false);
  const [isAppRevealed, setIsAppRevealed] = useState(false);
  const [isInitialSplash, setIsInitialSplash] = useState(true);

  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      const now = Date.now();
      let updatedUser = { ...user };
      let changed = false;

      // Initialize Trial if not set
      if (!user.trialExpiresAt && !user.isPremium) {
        // 3 days trial
        updatedUser.trialExpiresAt = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
        changed = true;
      }

      // Check for expiration
      if (!user.isPremium && user.trialExpiresAt) {
        const trialEnd = new Date(user.trialExpiresAt).getTime();
        if (now > trialEnd) {
          setIsTrialExpired(true);
          setShowPaywall(true);
        } else {
          setIsTrialExpired(false);
        }
      } else if (user.isPremium) {
        setIsTrialExpired(false);
        setShowPaywall(false);
      }

      if (changed) {
        updateUser(updatedUser);
      }
    }
  }, [user?.id, user?.isPremium, user?.trialExpiresAt]);

  // Block access if trial expired and not premium
  const isAccessBlocked = isTrialExpired && !user?.isPremium;

  useEffect(() => {
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
    
    // Local fallback to prevent onboarding loop
    localStorage.setItem(`ravona_onboarded_${user?.id}`, 'true');
    
    updateUser(updatedUser);
    setIsAppRevealed(true);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
      updateUser(updatedUser);
  };

  const handleViewUser = (userId: string) => {
    setPreviousTab(activeTab);
    setViewingUserId(userId);
    setActiveTab('user-profile');
  };

  if (userError && !isInitialSplash) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0c1222] p-8 text-center">
         <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500"></i>
         </div>
         <h2 className="text-xl font-bold text-white mb-2">Xatolik yuz berdi</h2>
         <p className="text-gray-400 text-sm mb-8">{userError}</p>
         <button 
           onClick={() => refreshUser()}
           className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition"
         >
           Qayta urinish
         </button>
      </div>
    );
  }

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
      <div className="flex flex-col items-center justify-center h-full bg-[#0c1222] px-8">
         <div className="loader mb-12 scale-75">
           <div>
             <ul>
               {[...Array(6)].map((_, i) => (
                 <li key={i}>
                   <svg fill="currentColor" viewBox="0 0 90 120">
                     <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z"></path>
                   </svg>
                 </li>
               ))}
             </ul>
           </div>
         </div>
         <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-4">Ma'lumotlar yuklanmoqda...</p>
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
          case 'speaking-club': return <SpeakingClub user={user} onNavigate={setActiveTab} onViewUser={handleViewUser} />;
          case 'leaderboard': return <Leaderboard user={user} onNavigate={setActiveTab} onViewUser={handleViewUser} />;
          case 'mock': return <RavonaMock user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />;
          case 'library': return <Library user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />;
          case 'profile': return <Profile user={user} onUpdateUser={handleUpdateUser} onShowAdmin={() => setIsAdminMode(true)} onShowPremium={() => setActiveTab('pricing')} />;
          case 'user-profile': return viewingUserId ? <UserProfileView userId={viewingUserId} onBack={() => { setActiveTab(previousTab); setViewingUserId(null); }} /> : <Home user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />;
          case 'dictionary': return <SmartDictionary user={user} onUpdateUser={handleUpdateUser} />;
          case 'translator': return <GrammarAnalyzer user={user} onNavigate={setActiveTab} />;
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
           {(showPaywall || isAccessBlocked) && (
             <React.Suspense fallback={null}>
               <Paywall 
                 user={user!} 
                 onActivate={() => {
                   setShowPaywall(false);
                   setIsTrialExpired(false); // Optimistic update
                   setActiveTab('pricing');
                 }} 
                 onClose={() => !isAccessBlocked && setShowPaywall(false)} 
                 isBlocked={isAccessBlocked}
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
