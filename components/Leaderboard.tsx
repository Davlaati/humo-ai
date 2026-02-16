import React, { useState, useEffect } from 'react';
import { UserProfile, LeaderboardEntry, LeaderboardPeriod } from '../types';
import { getLeaderboardData } from '../services/storageService';
import UserBadges from './UserBadges';

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
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getLeaderboardData(period, user);
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [period, user.xp]);

  const topThree = data.slice(0, 3);
  const rest = data.slice(3);
  const currentUserEntry = data.find(e => e.isCurrentUser);

  return (
    <div className="flex flex-col h-full bg-[#080d19] animate-fade-in relative text-white">
      {/* Background Decor from screenshot */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-blue-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      {/* Header */}
      <div className="px-6 pt-10 pb-4 z-20">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Liderlar</h1>
                <p className="text-[10px] font-bold text-blue-500/80 uppercase tracking-[0.2em] mt-1">Humo AI Global</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <i className="fa-solid fa-crown text-yellow-500 text-lg"></i>
            </div>
        </div>

        {/* Tab Selection matching screenshot style */}
        <div className="flex p-1 bg-white/5 rounded-full border border-white/5">
           {(['weekly', 'monthly', 'alltime'] as LeaderboardPeriod[]).map((p) => (
             <button
               key={p}
               onClick={() => setPeriod(p)}
               className={`flex-1 py-3 text-[10px] font-black rounded-full uppercase tracking-widest transition-all duration-300 ${period === p ? 'bg-blue-600/80 text-white shadow-lg' : 'text-slate-500'}`}
             >
               {p === 'weekly' ? 'Haftalik' : p === 'monthly' ? 'Oylik' : 'Barcha'}
             </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pb-44 no-scrollbar">
          
          {/* Podium Area matching screenshot */}
          <div className="flex justify-center items-end h-56 mb-8 px-4">
             {/* 2nd Place */}
             <div className="flex flex-col items-center w-20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="relative mb-3">
                   <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-500/50 flex items-center justify-center text-xl font-bold text-slate-300 overflow-hidden">
                      {topThree[1]?.name?.charAt(0)}
                   </div>
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-500 text-[#080d19] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#080d19]">2</div>
                </div>
                <p className="text-[10px] font-black text-yellow-500 uppercase truncate w-full text-center">{topThree[1]?.name}</p>
                <p className="text-[9px] font-bold text-blue-400">{(topThree[1]?.xp ?? 0).toLocaleString()} XP</p>
             </div>

             {/* 1st Place */}
             <div className="flex flex-col items-center w-28 mx-2 animate-slide-up">
                <div className="relative mb-4">
                   <div className="absolute -inset-2 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
                   <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 border-4 border-yellow-200/50 flex items-center justify-center text-4xl font-bold text-[#080d19] shadow-2xl overflow-hidden relative">
                      {topThree[0]?.name?.charAt(0)}
                   </div>
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-[#080d19] text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#080d19]">1</div>
                </div>
                <p className="text-xs font-black text-yellow-500 uppercase truncate w-full text-center">{topThree[0]?.name}</p>
                <p className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full mt-1">{(topThree[0]?.xp ?? 0).toLocaleString()} XP</p>
             </div>

             {/* 3rd Place */}
             <div className="flex flex-col items-center w-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="relative mb-3">
                   <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-orange-800/50 flex items-center justify-center text-xl font-bold text-orange-700 overflow-hidden">
                      {topThree[2]?.name?.charAt(0)}
                   </div>
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-orange-700 text-[#080d19] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#080d19]">3</div>
                </div>
                <p className="text-[10px] font-black text-yellow-500 uppercase truncate w-full text-center">{topThree[2]?.name}</p>
                <p className="text-[9px] font-bold text-blue-400">{(topThree[2]?.xp ?? 0).toLocaleString()} XP</p>
             </div>
          </div>

          {/* List Section */}
          <div className="space-y-2 mt-4">
            {rest.map((entry) => (
              <div 
                key={entry.userId}
                className="flex items-center py-4 px-5 rounded-[24px] bg-white/[0.02] border border-white/[0.03] transition-all active:scale-[0.98]"
              >
                <span className="w-8 text-[11px] font-bold text-slate-600 italic">#{entry.rank}</span>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm text-slate-400 mr-4 border border-white/5">
                  {entry.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-xs font-black uppercase tracking-tight">{entry.name}</p>
                    {/* Gamification: Compact badge integration */}
                    <UserBadges user={{...user, badges: (entry as any).badges || []} as any} compact={true} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">{entry.wins} G'alaba {entry.trend === 'up' && <span className="text-green-500 ml-1">▲</span>}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-200">{(entry.xp ?? 0).toLocaleString()}</p>
                  <p className="text-[8px] font-black text-slate-600 uppercase">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screenshot specific Footer Stats panel */}
      {!loading && currentUserEntry && (
        <div className="fixed bottom-[110px] left-4 right-4 z-40 animate-slide-up">
           <div className="bg-[#080d19]/90 backdrop-blur-2xl p-5 rounded-[32px] border border-blue-600/30 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between">
              <div className="flex items-center">
                  <div className="text-2xl font-black italic text-blue-500 mr-4 leading-none">{currentUserEntry.rank}</div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white mr-4 shadow-lg">
                    {currentUserEntry.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Sizning o'rningiz</p>
                    <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Global Rank</p>
                    </div>
                  </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-white leading-none">{(currentUserEntry.xp ?? 0).toLocaleString()} <span className="text-[10px] ml-0.5">0</span></p>
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Jami XP</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;