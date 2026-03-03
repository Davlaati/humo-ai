
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, EntryNotification as EntryNotifType, EnglishLevel } from './types';
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
import Premium from './components/Premium';
import AITutor from './components/AITutor';
import { getPremiumStatus, isPremiumActive } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [streakReward, setStreakReward] = useState<{days: number, coins: number} | null>(null);

  const [entryNotif, setEntryNotif] = useState<EntryNotifType | null>(null);
  const [showEntryNotif, setShowEntryNotif] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [trialNotif, setTrialNotif] = useState(false);
  const [isAppRevealed, setIsAppRevealed] = useState(false);
  const [isInitialSplash, setIsInitialSplash] = useState(true);
  const [logoError, setLogoError] = useState(false);

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
      setIsLoadingUser(true);
      try {
        const tg = (window as any).Telegram?.WebApp;
        const tgUser = tg?.initDataUnsafe?.user;
        
        if (tgUser) {
          const tgId = String(tgUser.id);
          const { fetchUserFromSupabase, syncUserToSupabase } = await import("./services/supabaseService");
          
          // 1. Supabase'dan tekshirish
          const remoteUser = await fetchUserFromSupabase(tgId);
          
          if (remoteUser) {
            // Mavjud foydalanuvchi
            const fullUser = { 
              ...remoteUser, 
              name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
              username: tgUser.username || remoteUser.username,
              avatarUrl: tgUser.photo_url || remoteUser.avatarUrl,
              activeSecondsToday: 0
            } as UserProfile;
            setUser(fullUser);
            saveUser(fullUser);
          } else {
            // Yangi foydalanuvchi yaratish
            const newUser: UserProfile = {
              id: tgId,
              name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
              username: tgUser.username || `user_${tgId.slice(-4)}`,
              avatarUrl: tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgId}`,
              age: '18+',
              level: EnglishLevel.Beginner,
              goal: 'General Learning',
              personalities: ['Kind'],
              studyMinutes: 0,
              practiceFrequency: 'daily',
              interests: [],
              coins: 500, // Bonus for new users
              xp: 0,
              streak: 0,
              lastActiveDate: new Date().toISOString(),
              joinedAt: new Date().toISOString(),
              isPremium: false,
              telegramStars: 0,
              starsHistory: [],
              settings: { language: 'Uz', theme: 'dark' },
              activeSecondsToday: 0
            };
            setUser(newUser);
            saveUser(newUser);
            await syncUserToSupabase(newUser);
            setTrialNotif(true);
          }
        } else {
          // Local storage fallback for development
          const storedUser = getUser();
          if (storedUser) setUser(storedUser);
        }
      } catch (error) {
        console.error("User initialization failed:", error);
      } finally {
        setIsLoadingUser(false);
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

  if (isInitialSplash || isLoadingUser) {
      return (
          <div className="fixed inset-0 bg-[#0f172a] z-[5000] flex flex-col items-center justify-center">
              <div className="relative flex flex-col items-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-30 animate-pulse"></div>
                  {/* LOGO INTEGRATION */}
                  {!logoError ? (
                    <img 
                      src="./logo.png" 
                      alt="Ravona AI" 
                      className="w-56 h-auto relative z-10 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] animate-pulse" 
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <h1 className="mt-4 text-4xl font-black italic tracking-tighter text-white opacity-80 uppercase">Ravona AI</h1>
                  )}
              </div>
              {isLoadingUser && !isInitialSplash && (
                <div className="mt-8 flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ma'lumotlar yuklanmoqda...</p>
                </div>
              )}
          </div>
      );
  }

  if (!user && !isInitialSplash && !isLoadingUser) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
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
      
      const premiumStatus = getPremiumStatus(user);
      const isPremium = isPremiumActive(user);

      // Restricted tabs if not premium
      const restrictedTabs = ['speaking-club', 'game', 'translator', 'dictionary', 'tutor'];
      if (!isPremium && restrictedTabs.includes(activeTab)) {
          return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mb-6 border border-yellow-500/20">
                    <i className="fa-solid fa-lock text-4xl text-yellow-500"></i>
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Premium Kerak</h2>
                <p className="text-slate-400 text-sm mb-8">Ushbu funksiyadan foydalanish uchun Premium obunani faollashtiring yoki 3 kunlik bepul sinov muddatini kuting.</p>
                <button 
                  onClick={() => setShowPremium(true)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg"
                >
                  Premiumga O'tish
                </button>
            </div>
          );
      }

      switch (activeTab) {
          case 'home': return <Home user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} streakReward={streakReward} onClearStreakReward={() => setStreakReward(null)} />;
          case 'learn': return <Lesson user={user} onUpdateUser={handleUpdateUser} />;
          case 'wordbank': return <WordBank user={user} onUpdateUser={handleUpdateUser} />;
          case 'game': return <Game user={user} />;
          case 'speaking-club': return <SpeakingClub user={user} onNavigate={setActiveTab} onUpdateUser={handleUpdateUser} />;
          case 'leaderboard': return <Leaderboard user={user} onNavigate={setActiveTab} />;
          case 'profile': return <Profile user={user} onUpdateUser={handleUpdateUser} onShowAdmin={() => setIsAdminMode(true)} onShowPremium={() => setShowPremium(true)} />;
          case 'dictionary': return <SmartDictionary user={user} onUpdateUser={handleUpdateUser} />;
          case 'tutor': return <AITutor user={user} onNavigate={setActiveTab} onUpdateUser={handleUpdateUser} />;
          case 'translator': return <Translator user={user} onNavigate={setActiveTab} onUpdateUser={handleUpdateUser} />;
          default: return <Home user={user} onUpdateUser={handleUpdateUser} onNavigate={setActiveTab} />;
      }
  };

  return (
    <>
       {showPremium && user && (
           <div className="fixed inset-0 z-[6000] bg-slate-950">
               <Premium 
                 user={user} 
                 onUpdateUser={handleUpdateUser} 
                 onClose={() => setShowPremium(false)} 
               />
           </div>
       )}

       {trialNotif && (
           <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
               <div className="glass-card w-full max-w-sm p-8 rounded-3xl border border-blue-500/30 text-center shadow-2xl shadow-blue-500/20">
                   <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg">
                       <i className="fa-solid fa-gift text-3xl text-white"></i>
                   </div>
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Xush Kelibsiz!</h2>
                   <p className="text-slate-400 text-sm mb-8">Sizga 3 kunlik bepul Premium taqdim etildi. Barcha funksiyalardan cheklovlarsiz foydalanishingiz mumkin!</p>
                   <button 
                     onClick={() => setTrialNotif(false)}
                     className="w-full py-4 bg-blue-600 rounded-2xl font-black text-lg uppercase tracking-wider"
                   >
                     Rahmat!
                   </button>
               </div>
           </div>
       )}

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
           {activeTab === 'wallet' ? (
               <Layout activeTab="home" onTabChange={setActiveTab} showNav={false}>
                   <Wallet user={user!} onUpdateUser={handleUpdateUser} />
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
