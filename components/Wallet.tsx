import React, { useState } from 'react';
import { UserProfile } from '../types';
import { convertHumoToStars, saveUser } from '../services/storageService';
import { createStarsInvoice, getStarsBalance, simulatePaymentSuccess } from '../services/starsPaymentService';

interface WalletProps {
  user: UserProfile;
}

const STAR_VARIANTS = [
  { key: 's50', stars: 50, cost: 500 },
  { key: 's100', stars: 100, cost: 1000 },
  { key: 's250', stars: 250, cost: 2500 },
  { key: 's500', stars: 500, cost: 5000 },
];

const Wallet: React.FC<WalletProps> = ({ user }) => {
  const [confirmModal, setConfirmModal] = useState<(typeof STAR_VARIANTS)[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleConvertClick = (variant: (typeof STAR_VARIANTS)[0]) => setConfirmModal(variant);

  const executeConversion = () => {
    if (!confirmModal) return;
    setIsProcessing(true);

    setTimeout(() => {
      const updatedUser = convertHumoToStars(confirmModal.stars);
      if (updatedUser) {
        window.location.reload();
      } else {
        setError('HC yetarli emas!');
      }
      setIsProcessing(false);
      setConfirmModal(null);
    }, 700);
  };

  const syncBalanceFromBackend = async (telegramId: string) => {
    const balanceData = await getStarsBalance(telegramId);
    if (!balanceData?.success) return;
    const updated = { ...user, telegramStars: balanceData.balanceStars };
    saveUser(updated);
  };

  const handleBuyStars = async (variant: (typeof STAR_VARIANTS)[0]) => {
    const telegramId = String((window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id || '');
    const username = String((window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.username || user.username || '');

    if (!telegramId) {
      setError('Buy Stars faqat Telegram ichida ishlaydi.');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const result = await createStarsInvoice({ telegramId, username, packageKey: variant.key });
      if (!result?.success) {
        setError('Invoice yaratilmadi');
        return;
      }

      if (result.mode === 'demo') {
        const simulated = await simulatePaymentSuccess(result.paymentId);
        if (simulated?.success) {
          await syncBalanceFromBackend(telegramId);
          window.location.reload();
        } else {
          setError('Demo payment xatoligi');
        }
        return;
      }

      const invoiceLink = result.invoiceLink;
      if (!invoiceLink) {
        setError('Invoice link topilmadi');
        return;
      }

      const tg = (window as any).Telegram?.WebApp;
      tg?.openInvoice(invoiceLink, async (status: string) => {
        if (status === 'paid') {
          await syncBalanceFromBackend(telegramId);
          window.location.reload();
        } else if (status === 'failed' || status === 'cancelled') {
          setError("To'lov bekor qilindi yoki muvaffaqiyatsiz bo'ldi");
        }
      });
    } catch {
      setError('To\'lov servisi bilan aloqa yo\'q');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 h-full overflow-y-auto no-scrollbar">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[32px] border border-yellow-500/30">
          <p className="text-[10px] text-yellow-400 font-black uppercase">Humo Coins</p>
          <h1 className="text-3xl font-black text-white">{user.coins.toLocaleString()}</h1>
        </div>
        <div className="glass-card p-5 rounded-[32px] border border-blue-500/30">
          <p className="text-[10px] text-blue-400 font-black uppercase">TG Stars</p>
          <h1 className="text-3xl font-black text-white">{user.telegramStars.toLocaleString()}</h1>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-3">
        <h3 className="font-bold text-white">Buy Stars (Bot Payment)</h3>
        {STAR_VARIANTS.map((variant) => (
          <button
            key={variant.key}
            onClick={() => handleBuyStars(variant)}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-3 rounded-xl font-bold flex items-center justify-between px-4"
          >
            <span>{variant.stars} Stars</span>
            <span>{variant.cost} HC</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-white">Convert Humo → Stars (local)</h3>
        {STAR_VARIANTS.map((variant) => (
          <button
            key={`convert-${variant.key}`}
            onClick={() => handleConvertClick(variant)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold"
          >
            Convert: {variant.cost} HC → {variant.stars} Stars
          </button>
        ))}
      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm" onClick={(event) => event.stopPropagation()}>
            <h4 className="font-bold text-white text-lg">Tasdiqlash</h4>
            <p className="text-slate-300 mt-2">
              {confirmModal.cost} HC evaziga {confirmModal.stars} Stars konvertatsiya qilinsinmi?
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setConfirmModal(null)} className="bg-slate-700 text-white py-2 rounded-lg">Bekor qilish</button>
              <button onClick={executeConversion} disabled={isProcessing} className="bg-blue-600 text-white py-2 rounded-lg">
                {isProcessing ? '...' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
