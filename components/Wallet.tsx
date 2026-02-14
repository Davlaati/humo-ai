import React, { useMemo, useState } from 'react';
import { UserProfile } from '../types';
import { saveUser } from '../services/storageService';
import { createSubscription, fetchCurrentUser } from '../services/publicApiService';

interface WalletProps {
  user: UserProfile;
}

const PLANS = [
  { key: '7d', title: '7 kun', price: 15000, description: 'Qisqa test premium access' },
  { key: '1m', title: '1 oy', price: 55000, description: 'Eng ommabop premium rejasi', recommended: true },
  { key: '1y', title: '1 yil', price: 550000, description: '1 year = 550,000 UZS (Save compared to monthly)' },
] as const;

const Wallet: React.FC<WalletProps> = ({ user }) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[number] | null>(null);
  const [proofImage, setProofImage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const premiumUntil = useMemo(() => {
    if (!(user as any).premiumUntil) return null;
    return new Date((user as any).premiumUntil).toLocaleDateString();
  }, [user]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofImage(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const submitPremiumRequest = async () => {
    if (!selectedPlan) {
      setError('Avval tarifni tanlang');
      return;
    }
    if (!proofImage) {
      setError('To‘lov chek rasmini yuklang');
      return;
    }

    const telegramId = String((window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id || user.id || '');
    const username = String((window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.username || user.username || '');

    if (!telegramId) {
      setError('Telegram ID topilmadi');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await createSubscription({
        telegramId,
        username,
        planType: selectedPlan.key,
        proofImage,
      });

      if (!response?.success) {
        setError(response?.message || 'So‘rov yuborilmadi');
        return;
      }

      setMessage('Your premium account will be activated soon after verification.');
      const me = await fetchCurrentUser(telegramId);
      if (me?.success && me.user) {
        saveUser({ ...user, isPremium: !!me.user.is_premium, premiumUntil: me.user.premium_until } as any);
      }
      setSelectedPlan(null);
      setProofImage('');
    } catch {
      setError('Backend bilan aloqa yo‘q');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      <div className="grid grid-cols-1 gap-4">
        <div className="glass-card p-5 rounded-[32px] bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Premium status</p>
              <h1 className="text-2xl font-black text-white mt-1">{user.isPremium ? 'ACTIVE' : 'INACTIVE'}</h1>
              {premiumUntil && <p className="text-xs text-slate-300 mt-1">Premium active until {premiumUntil}</p>}
            </div>
            {user.isPremium && <span className="px-3 py-1 rounded-full bg-yellow-500 text-slate-950 text-xs font-black">PREMIUM</span>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-black text-sm uppercase tracking-widest text-white">Premium Subscription</h3>
        {PLANS.map((plan) => (
          <button
            key={plan.key}
            onClick={() => setSelectedPlan(plan)}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedPlan?.key === plan.key ? 'border-blue-400 bg-blue-500/15' : 'border-white/10 bg-slate-900/70'} ${plan.recommended ? 'shadow-[0_10px_30px_rgba(59,130,246,0.25)]' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-white uppercase tracking-wide">{plan.title}</p>
                <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-blue-300">{plan.price.toLocaleString()} UZS</p>
                {plan.recommended && <p className="text-[10px] text-yellow-400 uppercase font-black">Recommended</p>}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/80 space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-white">Payment Instructions</h4>
        <p className="text-sm text-slate-300">1) To‘lovni admin kartasiga o‘tkazing. 2) Chek rasmini yuklang. 3) Admin tasdiqlaguncha status pending bo‘ladi.</p>
        <input type="file" accept="image/*" onChange={onFileChange} className="block w-full text-xs text-slate-300" />
        {proofImage && <img src={proofImage} alt="Proof preview" className="w-full h-40 object-cover rounded-xl border border-white/10" />}
        <button onClick={submitPremiumRequest} disabled={submitting} className="w-full py-3 rounded-xl bg-blue-600 text-white font-black disabled:opacity-50">
          {submitting ? 'Yuborilmoqda...' : 'Premium So‘rov yuborish'}
        </button>
        {message && <p className="text-green-400 text-sm">{message}</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default Wallet;
