
import React, { useState, useEffect } from 'react';
import { Users, Bell, CheckCircle, Loader2, ExternalLink, Gift, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import { playTapSound, playSuccessSound } from '../services/audioService';
import { claimWalletTasksReward } from '../services/supabaseService';

interface GrowthTasksProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const GrowthTasks: React.FC<GrowthTasksProps> = ({ user, onUpdateUser }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [referralCount, setReferralCount] = useState(user.referral_count || 0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isChannelJoinPending, setIsChannelJoinPending] = useState(false);
  const [isChannelJoinDone, setIsChannelJoinDone] = useState(false);

  useEffect(() => {
    setReferralCount(user.referral_count || 0);
  }, [user.referral_count]);

  const handleJoinChannel = () => {
    playTapSound();
    setIsChannelJoinPending(true);
    window.open('https://t.me/ravona_ai', '_blank');
    setTimeout(() => {
      setIsChannelJoinPending(false);
      setIsChannelJoinDone(true);
    }, 5000);
  };

  const handleInviteFriends = () => {
    playTapSound();
    const shareUrl = `https://t.me/share/url?url=https://t.me/ravonaai_bot?start=ref_${user.id}&text=Ravona AI bilan ingliz tilini o'rganing! 🚀`;
    window.open(shareUrl, '_blank');
  };

  const handleVerify = async () => {
    playTapSound();
    setIsVerifying(true);

    try {
      const response = await fetch('/api/verify-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, clientChannelJoined: isChannelJoinDone })
      });

      const result = await response.json();

      if (result.success && isChannelJoinDone) {
        const reward = await claimWalletTasksReward(user.id);

        const updatedUser: UserProfile = {
          ...user,
          isPremium: true,
          premiumUntil: reward.premiumUntil,
          wallet_reward_claimed: true,
          referral_count: reward.referralCount || result.referralCount || referralCount
        };

        playSuccessSound();
        onUpdateUser(updatedUser);
        setShowSuccess(true);
      } else {
        alert(result.message || "Vazifalar hali bajarilmagan. Kanalga kirib 5 soniya kuting va 3 do'st taklif qiling.");
      }
    } catch (err) {
      console.error("Verification failed:", err);
      alert("Tasdiqlashda xatolik yuz berdi.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (user.wallet_reward_claimed) {
    return (
      <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle className="text-white w-6 h-6" />
        </div>
        <h3 className="text-white font-bold mb-1">Premium uzaytirildi!</h3>
        <p className="text-emerald-400 text-xs">Barcha vazifalar muvaffaqiyatli bajarildi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Gift className="w-4 h-4 text-blue-500" />
          Bepul Premium oling
        </h3>
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-full">
          +3 kun
        </span>
      </div>

      <div className="space-y-3">
        {/* Task 1 */}
        <div className="p-4 bg-slate-800/50 border border-white/5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Bell className="text-blue-500 w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Kanalga obuna bo'ling</p>
            <p className="text-slate-500 text-[10px]">{isChannelJoinPending ? 'Tekshirilmoqda...' : (isChannelJoinDone ? 'Bajarildi ✅' : 'Yangiliklardan xabardor bo\'ling')}</p>
          </div>
          <button 
            onClick={handleJoinChannel}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Task 2 */}
        <div className="p-4 bg-slate-800/50 border border-white/5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
            <Users className="text-indigo-500 w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Do'stlarni taklif qiling</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500" 
                  style={{ width: `${Math.min((referralCount / 3) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-bold">{referralCount}/3</span>
            </div>
          </div>
          <button 
            onClick={handleInviteFriends}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      <button
        onClick={handleVerify}
        disabled={isVerifying}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 mt-2"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Tasdiqlanmoqda...
          </>
        ) : (
          <>
            Vazifalarni tasdiqlash
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-slate-500 italic">
        * Mukofotni faqat bir marta olish mumkin.
      </p>
    </div>
  );
};

export default GrowthTasks;
