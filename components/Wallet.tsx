import React, { useMemo, useState } from 'react';
import { PremiumPlanType, UserProfile } from '../types';
import { getActiveSubscription, submitPremiumRequest, getPremiumRequests, saveUser } from '../services/storageService';

interface WalletProps {
  user: UserProfile;
}

const PLANS: Array<{ type: PremiumPlanType; title: string; price: number; subtitle: string; recommended?: boolean }> = [
  { type: '7d', title: '7 kun', price: 15000, subtitle: 'Sinov muddati' },
  { type: '1m', title: '1 oy', price: 55000, subtitle: 'Eng mashhur', recommended: true },
  { type: '1y', title: '1 yil', price: 550000, subtitle: 'Save compared to monthly' },
];

const formatUzs = (amount: number) => `${amount.toLocaleString('ru-RU')} UZS`;

const Wallet: React.FC<WalletProps> = ({ user }) => {
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanType>('1m');
  const [proofImage, setProofImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const activeSubscription = useMemo(() => getActiveSubscription(user.id), [user.id, message]);
  const pendingRequest = useMemo(
    () => getPremiumRequests().find((item) => item.userId === user.id && item.status === 'pending') || null,
    [message, user.id],
  );

  const handleProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPremium = () => {
    if (!proofImage) {
      setMessage('Iltimos, to‘lov chek rasmini yuklang.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      submitPremiumRequest(user, selectedPlan, proofImage);
      saveUser({ ...user, isPremium: Boolean(activeSubscription) });
      setMessage('Your premium account will be activated soon after verification.');
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar relative">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[32px] bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/30">
          <p className="text-[10px] text-yellow-400 font-black uppercase tracking-[0.2em]">Humo Coins</p>
          <h1 className="text-3xl font-black text-white">{user.coins.toLocaleString()}</h1>
        </div>
        <div className="glass-card p-5 rounded-[32px] bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30">
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Premium</p>
          <h1 className="text-2xl font-black text-white">{activeSubscription ? 'Active' : 'Standard'}</h1>
        </div>
      </div>

      {activeSubscription ? (
        <div className="glass-card p-6 rounded-[36px] border border-green-500/30 bg-green-500/10 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-green-300 font-black">Premium badge</p>
              <h3 className="text-2xl font-black text-white mt-2">Siz premiumsiz!</h3>
              <p className="text-sm text-slate-300 mt-2">Premium active until {new Date(activeSubscription.expiresAt || '').toLocaleDateString()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-400/40 flex items-center justify-center">
              <i className="fa-solid fa-crown text-green-300 text-2xl"></i>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs">Premium Plans</h3>
            <div className="space-y-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.type}
                  onClick={() => setSelectedPlan(plan.type)}
                  className={`w-full text-left p-5 rounded-[28px] border transition-all duration-300 ${
                    selectedPlan === plan.type
                      ? 'bg-blue-600/20 border-blue-500/60 shadow-[0_12px_30px_rgba(59,130,246,0.2)]'
                      : 'bg-slate-900/60 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">{plan.subtitle}</p>
                      <h4 className="text-2xl font-black text-white mt-1">{plan.title}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-yellow-300">{formatUzs(plan.price)}</p>
                      {plan.recommended && (
                        <span className="inline-block mt-1 px-2 py-1 text-[9px] rounded-full bg-blue-500 text-white font-black uppercase tracking-widest">
                          Recommended
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">1 month = 55,000 UZS • 1 year = 550,000 UZS (Save compared to monthly)</p>
          </div>

          <div className="glass-card p-6 rounded-[32px] border border-white/10 bg-slate-900/60 space-y-4">
            <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs">Payment Instruction</h3>
            <p className="text-sm text-slate-300">Admin karta raqamiga to‘lov qiling va chek rasmini yuklang.</p>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-sm text-blue-200">
              Karta: <span className="font-black text-white">9860 1234 5678 9012</span>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-black">Chek rasmi</span>
              <input type="file" accept="image/*" onChange={handleProofUpload} className="mt-2 w-full text-sm text-slate-300" />
            </label>

            {proofImage && <img src={proofImage} alt="proof" className="w-full h-40 object-cover rounded-2xl border border-white/10" />}

            <button
              onClick={handleSubmitPremium}
              disabled={isSubmitting || Boolean(pendingRequest)}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-xs"
            >
              {pendingRequest ? 'Pending verification' : isSubmitting ? 'Yuborilmoqda...' : 'Submit for Verification'}
            </button>

            {pendingRequest && (
              <p className="text-sm text-yellow-300">Your premium account will be activated soon after verification.</p>
            )}
            {message && <p className="text-sm text-green-300">{message}</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default Wallet;
