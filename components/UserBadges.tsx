
import React from 'react';
import { UserProfile } from '../types';
import { BADGE_DEFINITIONS } from '../services/achievementSystem';

interface UserBadgesProps {
  user: UserProfile;
  compact?: boolean;
}

const UserBadges: React.FC<UserBadgesProps> = ({ user, compact = false }) => {
  const badgeIds = (user as any).badges || [];

  if (compact) {
    const mainBadge = badgeIds.length > 0 ? BADGE_DEFINITIONS[badgeIds[badgeIds.length - 1]] : null;
    if (!mainBadge) return null;
    return (
      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10 ml-2" title={mainBadge.name}>
        <i className={`fa-solid ${mainBadge.icon} text-[8px]`} style={{ color: mainBadge.color }}></i>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-sm uppercase tracking-tighter">Achievements</h3>
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{badgeIds.length} / 6 Earned</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.values(BADGE_DEFINITIONS).map((badge) => {
          const isEarned = badgeIds.includes(badge.id);
          
          return (
            <div key={badge.id} className={`flex flex-col items-center transition-all duration-500 ${isEarned ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-90'}`}>
              <div className={`
                relative w-16 h-16 flex items-center justify-center mb-2
                ${badge.type === 'shield' ? 'rounded-[20px]' : 'clip-hex'}
                ${isEarned ? 'bg-white/5 border-2 shadow-xl' : 'bg-white/5 border border-dashed border-white/10'}
              `} style={{ borderColor: isEarned ? `${badge.color}44` : 'transparent' }}>
                
                {isEarned && (
                  <div className="absolute inset-0 blur-xl opacity-20" style={{ backgroundColor: badge.color }}></div>
                )}
                
                <i className={`fa-solid ${badge.icon} text-2xl relative z-10`} style={{ color: isEarned ? badge.color : '#475569' }}></i>
                
                {badge.type === 'hex' && (
                  <div className="absolute inset-0 border border-white/10 clip-hex"></div>
                )}
              </div>
              <span className="text-[8px] font-black uppercase text-center tracking-tighter leading-tight">{badge.name}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .clip-hex {
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
      `}</style>
    </div>
  );
};

export default UserBadges;
