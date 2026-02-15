import React, { useMemo, useState } from 'react';
import { UserProfile } from '../types';
import { createSubscriptionRequest, getSubscriptions } from '../services/storageService';
import { playTapSound } from '../services/audioService';

interface WalletProps {
  user: UserProfile;
}

const PREMIUM_PLANS = [
  { id: '7d' as const, title: '7 kun', price: 15000, subtitle: 'Boshlash uchun ideal' },
  { id: '1m' as const, title: '1 oy', price: 55000, subtitle: '1 month = 55,000 UZS', recommended: true },
  { id: '1y' as const, title: '1 yil', price: 550000, subtitle: 'Save compared to monthly' },
];

const Wallet: React.FC<WalletProps> = ({ user }) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof PREMIUM_PLANS[number] | null>(null);
  const [proofImage, setProofImage] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const mySubscriptions = useMemo(
    () => getSubscriptions().filter((item) => item.userId === user.id),
    [user.id, submitMessage]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofImage(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedPlan || !proofImage) return;
    playTapSound();
    createSubscriptionRequest({
      userId: user.id,
      username: user.username,
      planType: selectedPlan.id,
      price: selectedPlan.price,
      proofImage,
    });
    setSubmitMessage('Your premium account will be activated soon after verification.');
    setProofImage('');
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar relative">
      <div className="glass-card p-6 rounded-[32px] bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/30 shadow-[0_10px_30px_rgba(234,179,8,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-[0.2em]">Premium Status</p>
            <h1 className="text-2xl font-black text-white mt-1">{user.isPremium ? 'ACTIVE' : 'FREE PLAN'}</h1>
            <p className="text-[10px] text-slate-400 mt-1">
              {user.isPremium && user.premiumExpiresAt
                ? `Premium active until ${new Date(user.premiumExpiresAt).toLocaleDateString('uz-UZ')}`
                : 'Premium features are locked until approval.'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center">
            <i className="fa-solid fa-crown text-yellow-500 text-xl"></i>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-[40px] border border-white/5 bg-slate-800/20 backdrop-blur-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">Premium Obuna</h2>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">UZS pricing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PREMIUM_PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`relative text-left p-5 rounded-3xl border transition-all active:scale-95 ${
                selectedPlan?.id === plan.id
                  ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_10px_30px_rgba(234,179,8,0.2)]'
                  : 'border-white/10 bg-slate-900/40 hover:border-yellow-500/40'
              } ${plan.recommended ? 'animate-pulse' : ''}`}
            >
              {plan.recommended && (
                <span className="absolute -top-2 right-4 px-2 py-1 rounded-full bg-yellow-500 text-slate-900 text-[8px] font-black uppercase tracking-widest">
                  tavsiya etiladi
                </span>
              )}
              <p className="text-sm text-white font-black uppercase">{plan.title}</p>
              <p className="text-2xl text-yellow-400 font-black mt-2">{plan.price.toLocaleString()} UZS</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">{plan.subtitle}</p>
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">To'lov yo'riqnomasi</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            1) Admin karta raqamiga o'tkazma qiling. 2) To'lov chek rasmini yuklang. 3) So'rov pending holatga tushadi.
          </p>
          <label className="w-full block p-4 rounded-2xl border border-dashed border-blue-500/40 bg-blue-500/5 cursor-pointer text-center">
            <span className="text-[10px] uppercase tracking-widest font-black text-blue-400">Chek rasmini yuklash</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>

          {proofImage && <img src={proofImage} alt="receipt" className="w-full h-40 object-cover rounded-2xl border border-white/10" />}

          <button
            onClick={handleSubmit}
            disabled={!selectedPlan || !proofImage}
            className="w-full py-4 rounded-[20px] bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-[0.2em]"
          >
            Premium so'rov yuborish
          </button>

          {submitMessage && <p className="text-emerald-400 text-xs font-bold">{submitMessage}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Obuna so'rovlari</h3>
        {mySubscriptions.map((item) => (
          <div key={item.id} className="glass-card p-4 rounded-3xl border border-white/10 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-white uppercase">{item.planType} · {item.price.toLocaleString()} UZS</p>
              <span className={`text-[10px] font-black uppercase ${item.status === 'approved' ? 'text-emerald-400' : item.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wallet;
