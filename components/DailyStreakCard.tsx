
import React from 'react';
import { UserProfile } from '../types';

interface DailyStreakCardProps {
  user: UserProfile;
}

const DailyStreakCard: React.FC<DailyStreakCardProps> = ({ user }) => {
  const streak = user.streak || 0;
  const multiplier = (user as any).streakStats?.xpMultiplier || 1;

  // Days mapping for the visual bar (1 to 7)
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="mx-4 mb-6">
      <div className="glass-card rounded-[35px] p-6 relative overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/5">
        {/* Background Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Daily Streak</h3>
            <div className="flex items-center mt-1">
              <span className="text-3xl font-black italic tracking-tighter text-white mr-2">{streak}</span>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Days</span>
            </div>
          </div>
          
          {multiplier > 1 && (
            <div className="bg-yellow-500 text-slate-900 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.5)]">
              {multiplier}x XP Boost
            </div>
          )}
        </div>

        {/* Horizontal Progress Bar */}
        <div className="flex justify-between items-center px-1">
          {days.map((day) => {
            const currentDayOfCycle = ((streak - 1) % 7) + 1;
            const isCompleted = day < currentDayOfCycle || (streak >= day && streak % 7 === 0);
            const isCurrent = day === currentDayOfCycle;

            return (
              <div key={day} className="flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-500 mb-2">D{day}</span>
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500
                  ${isCompleted ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                    isCurrent ? 'bg-slate-800 border-2 border-blue-400 animate-pulse' : 'bg-slate-800 border border-white/5'}
                `}>
                  {isCompleted ? (
                    <i className="fa-solid fa-check text-white text-xs"></i>
                  ) : (
                    <i className={`fa-solid fa-bolt text-[10px] ${isCurrent ? 'text-blue-400' : 'text-slate-600'}`}></i>
                  )}
                </div>
                <div className={`text-[9px] font-black mt-2 ${isCompleted || isCurrent ? 'text-blue-400' : 'text-slate-600'}`}>
                  x{day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyStreakCard;
