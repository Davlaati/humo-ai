
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { playTapSound } from '../services/audioService';
import { fetchAdminSettingsFromSupabase, createPaymentInSupabase, uploadFileToSupabase } from '../services/supabaseService';
import { getAdminConfig } from '../services/storageService';
import { supabase } from '../services/supabaseClient';

interface CheckoutProps {
  user: UserProfile;
  plan: any;
  onSuccess: (user: UserProfile) => void;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ user, plan, onSuccess, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [cardNumber, setCardNumber] = useState(getAdminConfig().paymentCardNumber);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    const fetchSettings = async () => {
      try {
        const settings = await fetchAdminSettingsFromSupabase();
        if (settings && settings.paymentCardNumber) {
          setCardNumber(settings.paymentCardNumber);
        }
      } catch (err) {
        console.error('Error fetching card:', err);
      }
    };
    fetchSettings();

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    playTapSound();
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''));
    alert("Karta raqami nusxalandi!");
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const compressedBase64 = await compressImage(file);
      setReceiptImage(compressedBase64);
    }
  };

  const handleSubmit = async () => {
    if (!receiptFile || isSubmitting) return;
    
    playTapSound();
    setIsSubmitting(true);
    
    try {
      // 1. Upload to Supabase Storage
      let receiptUrl = '';
      try {
        receiptUrl = await uploadFileToSupabase('receipts', receiptFile);
      } catch (uploadErr) {
        console.error("Upload failed, using base64 as fallback", uploadErr);
        receiptUrl = receiptImage || '';
      }

      const paymentData = {
        userId: user.id,
        userName: user.name,
        userEmail: user.username,
        amount: plan.price,
        planSelected: plan.bonusMonth ? '13 OY (12+1)' : plan.name,
        receiptImageUrl: receiptUrl,
        status: 'pending' as const
      };

      try {
        await createPaymentInSupabase(paymentData);
      } catch (dbErr) {
        console.warn("Supabase payment failed, saving locally", dbErr);
        try {
          const { savePayment } = await import('../services/storageService');
          savePayment(paymentData);
        } catch (localErr) {
          console.error("Local save failed too:", localErr);
        }
      }

      // Instant activation (Temporary Premium)
      const updatedUser = {
        ...user,
        isPremium: true,
        isTemporaryPremium: true
      };
      
      onSuccess(updatedUser);
      alert("To'lov qabul qilindi! Hisobingiz vaqtinchalik faollashtirildi. Admin tasdiqlashini kuting.");
    } catch (error) {
      console.error("Payment submission error:", error);
      alert("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#0c1222] p-6 pb-32 overflow-y-auto no-scrollbar animate-fade-in">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mr-4 border border-white/10 active:scale-90 transition">
          <i className="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">To'lov</h1>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 mb-8 text-center">
        <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-2">
          Hisobni faollashtirish uchun belgilangan vaqt ichida to'lovni amalga oshiring
        </p>
        <div className="text-3xl font-black text-red-500 font-mono">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="glass-card rounded-[40px] p-8 border border-white/5 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-[60px]"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center pb-6 border-b border-white/5">
            <div>
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Tanlangan Tarif</h3>
              <p className="text-xl font-black text-white uppercase italic tracking-tighter">
                {plan.bonusMonth ? '13 OY (12+1)' : plan.name}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">To'lov miqdori</h3>
              <p className="text-xl font-black text-blue-400">
                {plan.price.toLocaleString()} UZS
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Karta raqami</h3>
            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
              <span className="text-xl font-black text-white font-mono tracking-wider">{cardNumber}</span>
              <button 
                onClick={handleCopy}
                className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 active:scale-90 transition-all"
              >
                <i className="fa-solid fa-copy text-blue-400"></i>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Chekni yuklang</h3>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
              />
              <div className={`w-full h-40 border-2 border-dashed rounded-[35px] flex flex-col items-center justify-center p-6 transition-all ${
                receiptImage ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5'
              }`}>
                {receiptImage ? (
                  <div className="flex flex-col items-center">
                    <i className="fa-solid fa-circle-check text-emerald-500 text-3xl mb-2"></i>
                    <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Chek yuklandi</p>
                  </div>
                ) : isUploading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-blue-400 text-3xl"></i>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up text-slate-600 text-3xl mb-2"></i>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest text-center">
                      Rasm yoki faylni shu yerga tashlang yoki tanlang
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        disabled={!receiptImage || isSubmitting}
        className={`w-full py-6 rounded-[30px] font-black text-xl shadow-xl uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${
          !receiptImage || isSubmitting
          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
          : 'bg-white text-slate-950 active:scale-95 shadow-[0_15px_40px_rgba(255,255,255,0.1)]'
        }`}
      >
        {isSubmitting ? (
          <i className="fa-solid fa-circle-notch animate-spin"></i>
        ) : (
          <>
            <span>To'lov qildim</span>
            <i className="fa-solid fa-check-double"></i>
          </>
        )}
      </button>
    </div>
  );
};

export default Checkout;
