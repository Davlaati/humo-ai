
import React, { useState, useEffect } from 'react';
import { UserProfile, LeaderboardEntry, LeaderboardPeriod } from '../types';
import { getLeaderboardData } from '../services/storageService';

interface LeaderboardProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ user, onNavigate }) => {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Safety Timeout: Agar 4 sekund ichida yuklanmasa, loadingni majburan tugatish
    const safetyTimer = setTimeout(() => {
        if (loading && isMounted) {
            console.warn("Leaderboard loading timeout reached.");
            setLoading(false);
        }
    }, 4000);
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getLeaderboardData(period, user);
        if (isMounted) {
          setData(result);
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      } catch (err) {
        console.error("Leaderboard error:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { 
        isMounted = false;
        clearTimeout(safetyTimer);
    };
  }, [period, user.xp]);

  const topThree = data.slice(0, 3);
  const rest = data.slice(3);
  const currentUserEntry = data.find(e => e.isCurrentUser);

  return (
    <div className="flex flex-col h-full bg-[#0c1222] animate-fade-in relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex flex-col space-y-6 z-20">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">Liderlar</h1>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Humo AI Global</p>
            </div>
            <div className="w-12 h-12 bg-yellow-400/10 rounded-2xl flex items-center justify-center border border-yellow-400/20 shadow-lg shadow-yellow-500/5">
                <i className="fa-solid fa-crown text-yellow-500 text-xl animate-pulse"></i>
            </div>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1.5 bg-white/5 rounded-[22px] border border-white/5 backdrop-blur-3xl shadow-inner">
           {(['weekly', 'monthly', 'alltime'] as LeaderboardPeriod[]).map((p) => (
             <button
               key={p}
               onClick={() => setPeriod(p)}
               className={`flex-1 py-3 text-[10px] font-black rounded-[18px] uppercase tracking-widest transition-all duration-500 ${period === p ? 'bg-blue-600 text-white shadow-[0_5px_15px_rgba(37,99,235,0.4)]' : 'text-slate-500'}`}
             >
               {p === 'weekly' ? 'Haftalik' : p === 'monthly' ? 'Oylik' : 'Barcha'}
             </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fa-solid fa-bolt text-2xl text-blue-500 animate-pulse"></i>
                </div>
            </div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Analiz qilinmoqda...</p>
        </div>

      ) : data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
            <i className="fa-solid fa-trophy text-3xl text-blue-400"></i>
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Reyting bo'sh</h3>
          <p className="text-sm text-slate-400 mt-2">Birinchi bo'lib dars yakunlang va reytingda ko'rining.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pb-44 no-scrollbar">
          
          {/* Podium Area */}
          <div className="flex justify-center items-end mb-14 h-52 px-2 relative mt-6">
             {/* 2nd Place */}
             {topThree[1] && (
               <div className="flex flex-col items-center w-24 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="relative mb-4">
                    <div className="w-18 h-18 rounded-3xl bg-slate-800 border-2 border-slate-400/30 flex items-center justify-center font-black text-2xl text-slate-300 shadow-2xl relative overflow-hidden">
                      {topThree[1].name.charAt(0)}
                      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-400/20"></div>
                    </div>
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-400 text-slate-950 text-[11px] font-black px-3.5 py-1 rounded-full shadow-xl border-2 border-[#0c1222]">2</div>
                  </div>
                  <p className="text-[11px] font-black truncate w-full text-center text-white uppercase tracking-tighter mb-1">{topThree[1].name}</p>
                  <p className="text-[10px] font-black text-blue-400">{topThree[1].xp.toLocaleString()} XP</p>
               </div>
             )}

             {/* 1st Place - Center */}
             {topThree[0] && (
               <div className="flex flex-col items-center w-36 pb-8 z-10 animate-slide-up">
                  <div className="relative mb-4">
                    <div className="absolute -inset-6 bg-yellow-500/15 rounded-full blur-[40px] animate-pulse"></div>
                    <div className="w-24 h-24 rounded-[38px] bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600 border-4 border-yellow-200 flex items-center justify-center font-black text-4xl text-white shadow-[0_15px_50px_rgba(234,179,8,0.4)] relative overflow-hidden">
                      {topThree[0].name.charAt(0)}
                      <div className="absolute inset-0 bg-white/15 -skew-x-12 translate-x-[-120%] animate-[shimmer_2.5s_infinite]"></div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950 text-sm font-black px-5 py-1.5 rounded-full shadow-2xl border-4 border-[#0c1222]">1</div>
                  </div>
                  <p className="text-sm font-black truncate w-full text-center text-yellow-500 uppercase tracking-tighter mb-1.5">{topThree[0].name}</p>
                  <p className="text-[11px] font-black text-white bg-white/10 px-3 py-0.5 rounded-full border border-white/5">{topThree[0].xp.toLocaleString()} XP</p>
               </div>
             )}

             {/* 3rd Place */}
             {topThree[2] && (
               <div className="flex flex-col items-center w-24 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="relative mb-4">
                    <div className="w-18 h-18 rounded-3xl bg-slate-800 border-2 border-orange-800/30 flex items-center justify-center font-black text-2xl text-orange-700 shadow-2xl relative overflow-hidden">
                      {topThree[2].name.charAt(0)}
                      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-orange-800/20"></div>
                    </div>
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-orange-700 text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-xl border-2 border-[#0c1222]">3</div>
                  </div>
                  <p className="text-[11px] font-black truncate w-full text-center text-white uppercase tracking-tighter mb-1">{topThree[2].name}</p>
                  <p className="text-[10px] font-black text-blue-400">{topThree[2].xp.toLocaleString()} XP</p>
               </div>
             )}
          </div>

          {/* List Section */}
          <div className="space-y-4 mt-6">
            {rest.map((entry) => (
              <div 
                key={entry.userId}
                className={`flex items-center p-5 rounded-[28px] border transition-all duration-300 ${entry.isCurrentUser ? 'bg-blue-600/20 border-blue-500/50 shadow-xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <span className="w-8 text-xs font-black text-slate-600 italic">#{entry.rank}</span>
                <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-sm mr-4 shadow-inner ${entry.isCurrentUser ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
                  {entry.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate uppercase tracking-tighter ${entry.isCurrentUser ? 'text-white' : 'text-slate-200'}`}>{entry.name}</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{entry.wins} G'alaba</span>
                    {entry.trend === 'up' && <i className="fa-solid fa-caret-up text-green-500 text-[9px]"></i>}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className={`text-base font-black ${entry.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>{entry.xp.toLocaleString()}</p>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Personal Stats */}
      {!loading && currentUserEntry && (
        <div className="fixed bottom-[115px] left-5 right-5 z-40 animate-slide-up">
           <div className="bg-[#0c1222]/95 backdrop-blur-3xl p-6 rounded-[35px] border border-blue-500/40 shadow-[0_-25px_60px_rgba(0,0,0,0.7)] flex items-center border-t-blue-400/20">
              <div className="w-12 font-black text-blue-400 text-2xl italic tracking-tighter">{currentUserEntry.rank}</div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white mr-5 shadow-xl border border-white/20">
                {currentUserEntry.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-tighter text-slate-400 mb-0.5">Sizning o'rningiz</p>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Global Rank</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white italic tracking-tighter">{currentUserEntry.xp.toLocaleString()}</p>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">Jami XP</p>
              </div>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
