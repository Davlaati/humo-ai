
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getLeaderboardData(period, user);
        if (isMounted) setData(result);
      } catch (err) {
        if (isMounted) setError("Leaderboard updating...");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [period, user]);

  const topThree = data.slice(0, 3);
  const rest = data.slice(3);
  const currentUserRank = data.find(e => e.isCurrentUser);

  const renderTab = (p: LeaderboardPeriod, label: string) => (
    <button
      onClick={() => setPeriod(p)}
      className={`flex-1 py-2 text-xs font-black rounded-lg transition-all duration-300 uppercase tracking-widest ${
        period === p 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 pb-20 relative overflow-hidden animate-slide-up">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/40 to-transparent pointer-events-none z-0"></div>

      <div className="p-4 z-20 flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center active:scale-95 transition border border-white/5">
          <i className="fa-solid fa-arrow-left text-sm"></i>
        </button>
        <h1 className="text-xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">Global Reyting</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-6 mb-6 z-20">
        <div className="glass-panel p-1 rounded-xl flex space-x-1 border border-white/5">
          {renderTab('weekly', 'Hafta')}
          {renderTab('monthly', 'Oy')}
          {renderTab('alltime', 'Hammasi')}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center z-20">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 animate-pulse text-[10px] font-black uppercase tracking-widest">Ma'lumotlar o'qilmoqda</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center z-20 px-6 text-center">
            <i className="fa-solid fa-cloud-bolt text-4xl text-gray-500 mb-4 opacity-30"></i>
            <p className="text-gray-400 text-sm">{error}</p>
            <button onClick={() => setPeriod(period)} className="mt-4 px-6 py-2 bg-blue-600 rounded-full text-xs font-black uppercase tracking-widest">Yangilash</button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 z-20 pb-16 no-scrollbar scroll-smooth">
          
          <div className="flex justify-center items-end mb-12 mt-8 px-2 relative min-h-[180px]">
            {topThree[1] && (
               <div className="flex flex-col items-center mx-2 z-10 w-24">
                   <div className="w-16 h-16 rounded-full border-2 border-slate-400 shadow-xl bg-slate-800 flex items-center justify-center relative mb-2">
                       <span className="text-2xl font-black text-slate-400 drop-shadow-md">{topThree[1].name.charAt(0)}</span>
                       <div className="absolute -bottom-2 bg-slate-400 text-slate-900 text-[10px] font-black px-3 py-0.5 rounded-full shadow border border-slate-900">2</div>
                   </div>
                   <p className="text-[10px] font-black text-slate-400 mb-0.5 max-w-[80px] truncate uppercase">{topThree[1].name}</p>
                   <p className="text-[10px] text-gray-500 font-bold">{topThree[1].xp} XP</p>
               </div>
            )}

            {topThree[0] && (
               <div className="flex flex-col items-center mx-2 z-30 w-32 pb-4">
                   <div className="absolute top-[-35px] text-3xl animate-bounce drop-shadow-2xl">👑</div>
                   <div className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.4)] bg-gradient-to-br from-yellow-600 via-yellow-400 to-yellow-600 flex items-center justify-center relative mb-3">
                       <span className="text-4xl font-black text-white drop-shadow-xl">{topThree[0].name.charAt(0)}</span>
                       <div className="absolute -bottom-3 bg-yellow-400 text-yellow-900 text-xs font-black px-4 py-1 rounded-full shadow-2xl border-2 border-slate-900">1</div>
                   </div>
                   <p className="text-xs font-black text-yellow-400 mb-0.5 max-w-[100px] truncate uppercase tracking-tighter">{topThree[0].name}</p>
                   <p className="text-[10px] text-yellow-200/80 font-black tracking-widest">{topThree[0].xp} XP</p>
               </div>
            )}

            {topThree[2] && (
               <div className="flex flex-col items-center mx-2 z-10 w-24 translate-y-2">
                   <div className="w-16 h-16 rounded-full border-2 border-orange-700 shadow-xl bg-slate-800 flex items-center justify-center relative mb-2">
                       <span className="text-2xl font-black text-orange-700 drop-shadow-md">{topThree[2].name.charAt(0)}</span>
                       <div className="absolute -bottom-2 bg-orange-700 text-orange-100 text-[10px] font-black px-3 py-0.5 rounded-full shadow border border-slate-900">3</div>
                   </div>
                   <p className="text-[10px] font-black text-orange-600 mb-0.5 max-w-[80px] truncate uppercase">{topThree[2].name}</p>
                   <p className="text-[10px] text-gray-500 font-bold">{topThree[2].xp} XP</p>
               </div>
            )}
          </div>

          <div className="space-y-2.5">
            {rest.map((entry) => (
              <div 
                key={entry.userId}
                className={`flex items-center p-3.5 rounded-2xl border transition-all duration-300 ${
                  entry.isCurrentUser 
                    ? 'bg-blue-600/30 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.3)] scale-[1.02]' 
                    : 'glass-card border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="w-7 font-black text-gray-500 text-[10px] italic tracking-widest">{entry.rank}</div>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm mr-4 shadow-inner ${entry.isCurrentUser ? 'bg-blue-500 text-white' : 'bg-slate-800 text-gray-400'}`}>
                    {entry.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-black text-sm truncate uppercase tracking-tighter ${entry.isCurrentUser ? 'text-white' : 'text-gray-200'}`}>{entry.name}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{entry.wins} G'alaba</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                    <p className={`font-black text-sm ${entry.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>{entry.xp.toLocaleString()} XP</p>
                    <div className="flex items-center justify-end space-x-1">
                        {entry.trend === 'up' && <i className="fa-solid fa-arrow-trend-up text-green-500 text-[8px]"></i>}
                        {entry.trend === 'down' && <i className="fa-solid fa-arrow-trend-down text-red-500 text-[8px]"></i>}
                        <span className="text-[8px] text-gray-500 font-black uppercase">Stat</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="h-20"></div>
        </div>
      )}
      
      {!loading && currentUserRank && currentUserRank.rank > 3 && (
          <div className="fixed bottom-24 left-4 right-4 z-40">
              <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl border-2 border-blue-500/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center animate-slide-up">
                <div className="w-8 font-black text-blue-400 text-sm italic">{currentUserRank.rank}</div>
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black mr-4 text-white shadow-lg border-2 border-white/10">
                    {currentUserRank.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-white uppercase tracking-tighter">Siz</p>
                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Sizning natijangiz</p>
                </div>
                <div className="text-right">
                    <p className="font-black text-base text-yellow-400 drop-shadow-md">{currentUserRank.xp.toLocaleString()} XP</p>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Leaderboard;
