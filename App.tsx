
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
import Translator from './components/Translator';


type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

const getTelegramUser = (): TelegramUser | null => {
  const tg = (window as any).Telegram?.WebApp;
  const unsafeUser = tg?.initDataUnsafe?.user;

  if (unsafeUser?.id) return unsafeUser as TelegramUser;

  const initData = tg?.initData;
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    if (!userParam) return null;
    const parsed = JSON.parse(userParam);
    return parsed?.id ? (parsed as TelegramUser) : null;
  } catch {
    return null;
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [streakReward, setStreakReward] = useState<{days: number, coins: number} | null>(null);

  const [entryNotif, setEntryNotif] = useState<EntryNotifType | null>(null);
  const [showEntryNotif, setShowEntryNotif] = useState(false);
  const [isAppRevealed, setIsAppRevealed] = useState(false);
  const [isInitialSplash, setIsInitialSplash] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

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

    // Foydalanuvchini yuklash
    const initUser = async () => {
      try {
        const tgUser = getTelegramUser();
      
        if (tgUser) {
        const tgId = String(tgUser.id);
        const { fetchUserFromSupabase, syncUserToSupabase } = await import("./services/supabaseService");
        
        // 1. Supabase'dan tekshirish
        const remoteUser = await fetchUserFromSupabase(tgId);
        
        if (remoteUser) {
          // Mavjud foydalanuvchi
          const fullUser = { 
            ...remoteUser, 
            name: (tgUser.first_name || 'User') + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
            username: tgUser.username || remoteUser.username,
            avatarUrl: tgUser.photo_url || remoteUser.avatarUrl,
            activeSecondsToday: 0,
            interests: remoteUser.interests || [],
            activityLog: remoteUser.activityLog || [],
            learnedWords: remoteUser.learnedWords || [],
            starsHistory: remoteUser.starsHistory || [],
            telegramStars: remoteUser.telegramStars || 0
          } as UserProfile;

          // Check for trial/premium expiry
          const now = new Date();
          const trialExpiry = fullUser.trialExpiresAt ? new Date(fullUser.trialExpiresAt) : null;
          const premiumExpiry = fullUser.premiumUntil ? new Date(fullUser.premiumUntil) : null;

          let isPremium = fullUser.isPremium || false;
          if (premiumExpiry && premiumExpiry < now) {
            isPremium = false;
          } else if (trialExpiry && trialExpiry < now && !fullUser.premiumUntil) {
            isPremium = false;
          }

          if (isPremium !== fullUser.isPremium) {
            fullUser.isPremium = isPremium;
            syncUserToSupabase(fullUser);
          }

          setUser(fullUser);
          saveUser(fullUser);
        } else {
          // Yangi foydalanuvchi yaratish
          const now = new Date();
          const trialExpiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
          
          const newUser: UserProfile = {
            id: tgId,
            name: (tgUser.first_name || 'User') + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
            username: tgUser.username || `user_${tgId.slice(-4)}`,
            avatarUrl: tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgId}`,
            coins: 500, // Bonus for new users
            xp: 0,
            streak: 0,
            level: 1,
            isPremium: true, // Start with trial as premium
            trialExpiresAt: trialExpiresAt,
            telegramStars: 0,
            starsHistory: [],
            settings: { language: 'Uz', theme: 'dark' },
            activeSecondsToday: 0,
            joinedAt: now.toISOString(),
            lastActiveDate: now.toISOString()
          };
          setUser(newUser);
          saveUser(newUser);
          await syncUserToSupabase(newUser);
        }
      } else {
        // Local storage fallback for development
        const storedUser = getUser();
        if (storedUser) setUser(storedUser);
      }
      } finally {
        setIsProfileLoading(false);
      }
    };
    initUser();

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
          case 'profile': return <Profile user={user} isLoading={isProfileLoading} onUpdateUser={handleUpdateUser} onShowAdmin={() => setIsAdminMode(true)} />;
          case 'dictionary': return <SmartDictionary user={user} />;
          case 'translator': return <Translator user={user} onNavigate={setActiveTab} onShowPaywall={() => setShowPaywall(true)} />;
          case 'pricing': {
            const Pricing = React.lazy(() => import('./components/Pricing'));
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
            const Checkout = React.lazy(() => import('./components/Checkout'));
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
               {(() => {
                 const Paywall = React.lazy(() => import('./components/Paywall'));
                 return <Paywall 
                   user={user!} 
                   onActivate={() => {
                     setShowPaywall(false);
                     setActiveTab('pricing');
                   }} 
                   onClose={() => setShowPaywall(false)} 
                 />;
               })()}
             </React.Suspense>
           )}
           {activeTab === 'wallet' ? (
               <Layout activeTab="home" onTabChange={setActiveTab} showNav={false}>
                   <Wallet user={user!} />
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
