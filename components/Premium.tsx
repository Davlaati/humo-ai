
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Transaction, AdminConfig } from '../types';
import { getAdminConfig, addTransaction, isPremiumActive, getPremiumStatus } from '../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onClose: () => void;
}

type PremiumPhase = 'landing' | 'payment' | 'success';

const Premium: React.FC<PremiumProps> = ({ user, onUpdateUser, onClose }) => {
  const [phase, setPhase] = useState<PremiumPhase>('landing');
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const adminConfig = getAdminConfig();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phase === 'payment') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  const handleSubmitPayment = async () => {
    if (!receipt) return;
    setIsSubmitting(true);

    // In a real app, we would upload the file to storage (e.g. Supabase Storage)
    // For now, we'll use a mock URL or base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      const newTransaction: Transaction = {
        id: `p2p_${Date.now()}`,
        userId: user.id,
        username: user.name,
        amount: adminConfig.premiumPriceUZS,
        cost: adminConfig.premiumPriceUSD,
        status: 'pending',
        proofUrl: base64String, // Mocking upload
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 1 month
      };

      addTransaction(newTransaction);

      // Automatically activate premium temporarily
      const updatedUser: UserProfile = {
        ...user,
        isPremium: true,
        pendingPremium: true,
        premiumExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      onUpdateUser(updatedUser);
      setPhase('success');
      setIsSubmitting(false);
    };
    reader.readAsDataURL(receipt);
  };

  const features = [
    { icon: 'fa-robot', title: 'Cheksiz AI Suhbat', desc: 'Gemini 3.1 Pro bilan istalgancha gaplashing' },
    { icon: 'fa-microphone-lines', title: 'Speaking Club', desc: 'Real-vaqtda ovozli muloqot va tahlil' },
    { icon: 'fa-book-open-reader', title: 'Eksklyuziv Darslar', desc: 'Faqat premium a\'zolar uchun maxsus kontent' },
    { icon: 'fa-bolt', title: 'Tezkor Tarjimon', desc: 'Cheklovlarsiz va reklamasiz tarjima' },
    { icon: 'fa-shield-halved', title: 'Reklamasiz', desc: 'Hech qanday chalg\'ituvchi reklamalar yo\'q' },
  ];

  if (phase === 'landing') {
    return (
      <div className="h-full bg-slate-950 text-white overflow-y-auto pb-20 animate-fade-in">
        <div className="relative h-64 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-4 rotate-3">
              <i className="fa-solid fa-crown text-4xl text-white drop-shadow-lg"></i>
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Ravona Premium</h1>
            <p className="text-blue-400 font-bold text-sm tracking-widest uppercase mt-1">Ingliz tilini professional o'rganing</p>
          </motion.div>
        </div>

        <div className="px-6 space-y-4 -mt-6 relative z-20">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4 rounded-2xl flex items-center space-x-4 border border-white/5"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl border border-blue-500/20">
                <i className={`fa-solid ${f.icon}`}></i>
              </div>
              <div>
                <h3 className="font-black text-sm uppercase">{f.title}</h3>
                <p className="text-xs text-slate-400">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 px-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-lg uppercase">-50% OFF</span>
            </div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Obuna narxi</p>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-4xl font-black">36,000 UZS</h2>
              <span className="text-blue-200 text-sm">/ oyiga</span>
            </div>
            <p className="text-[10px] text-blue-200 mt-2 italic opacity-80">* To'lovdan so'ng 1 oy davomida barcha imkoniyatlar ochiladi</p>
            
            <button 
              onClick={() => setPhase('payment')}
              className="w-full mt-6 py-4 bg-white text-blue-700 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg active:scale-95 transition-all"
            >
              Hozir Harid Qilish
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-4 py-3 text-slate-500 font-bold text-sm uppercase"
          >
            Keyinroq
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'payment') {
    return (
      <div className="h-full bg-slate-950 text-white overflow-y-auto pb-20 animate-fade-in p-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setPhase('landing')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <h2 className="text-xl font-black uppercase italic tracking-tighter">To'lov Sahifasi</h2>
          <div className="w-10"></div>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="text-4xl font-black text-blue-400 mb-1">{formatTime(timeLeft)}</div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">To'lov uchun qolgan vaqt</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-10"></div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-4">Karta Ma'lumotlari</p>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Karta Raqami</p>
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-lg font-mono font-bold tracking-wider">{adminConfig.cardNumber}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(adminConfig.cardNumber.replace(/\s/g, ''));
                    alert("Karta raqami nusxalandi!");
                  }}
                  className="text-blue-400"
                >
                  <i className="fa-regular fa-copy"></i>
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Karta Egasi</p>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="font-bold uppercase">{adminConfig.cardHolder}</span>
              </div>
            </div>

            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 flex items-center space-x-3">
              <i className="fa-solid fa-circle-info text-blue-400"></i>
              <p className="text-[10px] font-medium text-blue-200">
                Iltimos, to'lovni amalga oshirgandan so'ng chekni (skrinshot) pastga yuklang.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase px-2">To'lov Tasdig'i (Chek)</p>
          
          <label className={`
            w-full h-40 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer
            ${receipt ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'}
          `}>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            {receipt ? (
              <div className="flex flex-col items-center text-center p-4">
                <i className="fa-solid fa-circle-check text-4xl text-green-500 mb-2"></i>
                <p className="text-sm font-bold truncate max-w-[200px]">{receipt.name}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Rasm yuklandi</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-600 mb-2"></i>
                <p className="text-sm font-bold">Chekni yuklash</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">JPG, PNG formatlarida</p>
              </div>
            )}
          </label>

          <button 
            onClick={handleSubmitPayment}
            disabled={!receipt || isSubmitting}
            className={`
              w-full py-5 rounded-2xl font-black text-lg uppercase tracking-wider transition-all
              ${receipt && !isSubmitting ? 'bg-blue-600 shadow-xl shadow-blue-600/20 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
            {isSubmitting ? 'Yuborilmoqda...' : 'To\'lov Qildim'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/20">
          <i className="fa-solid fa-check text-5xl text-white"></i>
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Muvaffaqiyatli!</h2>
        <p className="text-center text-slate-400 mb-8">
          To'lov tasdig'i yuborildi. Premium imkoniyatlar avtomatik faollashdi! Admin chekni tasdiqlagandan so'ng obuna doimiy bo'ladi.
        </p>
        
        <button 
          onClick={onClose}
          className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg uppercase tracking-wider"
        >
          Boshlash
        </button>
      </div>
    );
  }

  return null;
};

export default Premium;
