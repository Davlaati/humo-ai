
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { UserProfile, AdminSettings } from '../types';
import { fetchAdminSettingsFromSupabase, createPaymentInSupabase, syncUserToSupabase } from '../services/supabaseService';
import { playTapSound } from '../services/audioService';

interface CheckoutProps {
  user: UserProfile;
  plan: { id: string, name: string, price: number, durationMonths: number };
  onSuccess: (updatedUser: UserProfile) => void;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ user, plan, onSuccess, onBack }) => {
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [countdown, setCountdown] = useState(30 * 60); // 30 minutes
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await fetchAdminSettingsFromSupabase();
      setAdminSettings(settings);
    };
    loadSettings();

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopyCard = () => {
    if (adminSettings?.paymentCardNumber) {
      navigator.clipboard.writeText(adminSettings.paymentCardNumber.replace(/\s/g, ''));
      playTapSound();
      alert("Karta raqami nusxalandi!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaid = async () => {
    if (!receiptImage || isSubmitting) return;
    
    playTapSound();
    setIsSubmitting(true);

    try {
      // 1. Create payment record
      await createPaymentInSupabase({
        userId: user.id,
        userName: user.name,
        userEmail: user.username, // Using username as email fallback
        amount: plan.price,
        planSelected: plan.name,
        receiptImageUrl: receiptImage,
        status: 'pending'
      });

      // 2. Set temporary premium status
      const updatedUser = {
        ...user,
        isPremium: true,
        isTemporaryPremium: true
      };
      
      await syncUserToSupabase(updatedUser);
      onSuccess(updatedUser);
      alert("To'lov qabul qilindi! Hisobingiz vaqtinchalik faollashtirildi. Admin tasdiqlashini kuting.");
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pb-32 min-h-full bg-[#0c1222] animate-fade-in overflow-y-auto no-scrollbar">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mr-4 border border-white/10 active:scale-90 transition">
          <i className="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">To'lov</h1>
      </div>

      {/* Countdown */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4 mb-8 text-center">
        <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">
          Hisobni faollashtirish uchun belgilangan vaqt ichida to'lovni amalga oshiring
        </p>
        <div className="text-2xl font-black text-red-500">{formatTime(countdown)}</div>
      </div>

      {/* Plan Details */}
      <div className="glass-card rounded-[35px] p-6 mb-8 border border-white/5">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Tanlangan Tarif</h3>
        <div className="flex justify-between items-center">
          <span className="text-xl font-black text-white uppercase italic">{plan.name}</span>
          <span className="text-xl font-black text-blue-400">{plan.price.toLocaleString()} UZS</span>
        </div>
      </div>

      {/* Card Details */}
      <div className="glass-card rounded-[35px] p-8 mb-8 border border-white/10 relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20">
        <div className="relative z-10">
          <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-6">To'lov uchun karta</h3>
          <div className="text-2xl font-black text-white tracking-[0.2em] mb-8">
            {adminSettings?.paymentCardNumber || '8600 .... .... ....'}
          </div>
          <button 
            onClick={handleCopyCard}
            className="w-full py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 font-black text-xs uppercase tracking-widest text-white active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-copy"></i>
            <span>Nusxa olish</span>
          </button>
        </div>
      </div>

      {/* Receipt Upload */}
      <div className="space-y-4 mb-8">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2">Chekni yuklang</h3>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`w-full aspect-video rounded-[35px] border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all cursor-pointer ${
            receiptImage ? 'border-green-500 bg-green-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          {isUploading ? (
            <i className="fa-solid fa-circle-notch animate-spin text-3xl text-blue-400"></i>
          ) : receiptImage ? (
            <div className="relative w-full h-full flex flex-col items-center">
              <img src={receiptImage} alt="Receipt" className="h-full object-contain rounded-xl mb-2" />
              <span className="text-green-400 text-[10px] font-black uppercase">Yuklandi ✅</span>
            </div>
          ) : (
            <>
              <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-600 mb-4"></i>
              <p className="text-slate-500 text-xs font-bold text-center">Rasm yoki PDF yuklang</p>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Submit Button */}
      <button 
        onClick={handlePaid}
        disabled={!receiptImage || isSubmitting}
        className={`w-full py-6 rounded-[30px] font-black text-xl uppercase tracking-[0.2em] transition-all shadow-2xl ${
          !receiptImage || isSubmitting
          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
          : 'liquid-button text-white active:scale-95'
        }`}
      >
        {isSubmitting ? 'Yuborilmoqda...' : "To'lov qildim"}
      </button>
    </div>
  );
};

export default Checkout;
