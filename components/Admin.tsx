
import React, { useState, useEffect } from 'react';
import { 
  Transaction, UserProfile, EntryNotification, 
  SubscriptionPackage, Discount, DictionaryItem, 
  AdminLog, PlatformAnalytics, AdminConfig, Payment, AdminSettings
} from '../types';
import { 
  getTransactions, getUser, adminUpdateBalance, 
  getEntryNotification, saveEntryNotification,
  getAllUsers, updateOtherUser, getSubscriptionPackages,
  saveSubscriptionPackage, getDiscounts, saveDiscount,
  deleteDiscount, getDictionaryItems, saveDictionaryItem,
  getAdminLogs, addAdminLog, getPlatformAnalytics,
  getAdminConfig, saveAdminConfig, updateTransaction
} from '../services/storageService';
import { 
  fetchPendingPaymentsFromSupabase, 
  updatePaymentStatusInSupabase, 
  fetchAdminSettingsFromSupabase, 
  updateAdminSettingsInSupabase,
  updatePremiumStatusInSupabase
} from '../services/supabaseService';

type AdminTab = 'dashboard' | 'users' | 'premium' | 'marketing' | 'dictionary' | 'discounts' | 'security';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  
  // Balans boshqaruvi
  const [starAmt, setStarAmt] = useState<number>(0);
  const [coinAmt, setCoinAmt] = useState<number>(0);

  // Notification states
  const [notif, setNotif] = useState<EntryNotification>(getEntryNotification() || {
    id: '1', title: '', description: '', buttonText: '', target: 'all', isActive: true, createdAt: '',
    buttonAction: { type: 'close', value: '' }
  });

  // Dictionary states
  const [dictItems, setDictItems] = useState<DictionaryItem[]>([]);
  const [newWord, setNewWord] = useState<Partial<DictionaryItem>>({ term: '', translation: '', definition: '', example: '', category: 'General' });

  // Discount states
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({ code: '', percentage: 10, expiryDate: '', isActive: true });

  // Subscription states
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(getAdminConfig());
  const [newCardNumber, setNewCardNumber] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const refreshData = async () => {
      try {
        const [
          transactions,
          allUsers,
          platformAnalytics,
          adminLogs,
          dictionaryItems,
          allDiscounts,
          subPackages,
          payments,
          settings
        ] = await Promise.all([
          getTransactions(),
          getAllUsers(),
          getPlatformAnalytics(),
          getAdminLogs(),
          getDictionaryItems(),
          getDiscounts(),
          getSubscriptionPackages(),
          fetchPendingPaymentsFromSupabase(),
          fetchAdminSettingsFromSupabase()
        ]);

        if (isMounted) {
          setTxs(transactions.reverse());
          setPendingPayments(payments);
          setCurrentUser(getUser());
          setUsers(allUsers);
          setAnalytics(platformAnalytics);
          setLogs(adminLogs);
          setDictItems(dictionaryItems);
          setDiscounts(allDiscounts);
          setPackages(subPackages);
          if (settings) setNewCardNumber(settings.paymentCardNumber);
        }
      } catch (err) {
        console.error("Admin data refresh failed:", err);
      }
    };

    refreshData();
    const interval = setInterval(refreshData, 10000); // Refresh every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleUpdateBalances = () => {
      if (starAmt === 0 && coinAmt === 0) return;
      adminUpdateBalance(starAmt, coinAmt);
      addAdminLog('Balance Update', `Updated balance: Stars ${starAmt}, Coins ${coinAmt}`);
      setStarAmt(0);
      setCoinAmt(0);
      alert("Foydalanuvchi balansi muvaffaqiyatli o'zgartirildi!");
  };

  const handleSaveNotif = () => {
      saveEntryNotification(notif);
      addAdminLog('Notification Update', `Updated entry notification: ${notif.title}`);
      alert("Kirish xabarnomasi yangilandi!");
  };

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    await updateOtherUser(userId, { isBlocked: !isBlocked });
    addAdminLog('User Status Update', `${!isBlocked ? 'Blocked' : 'Unblocked'} user ${userId}`);
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

  const handleTogglePremium = async (userId: string, isPremium: boolean) => {
    await updateOtherUser(userId, { isPremium: !isPremium, premiumExpiryDate: !isPremium ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined });
    addAdminLog('User Premium Update', `${!isPremium ? 'Granted' : 'Revoked'} premium for user ${userId}`);
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

  const handleSaveAdminConfig = async () => {
    await updateAdminSettingsInSupabase({ paymentCardNumber: newCardNumber });
    addAdminLog('Admin Config Update', `Updated card number: ${newCardNumber}`);
    alert("Karta ma'lumotlari saqlandi!");
  };

  const handleApprovePayment = async (payment: Payment) => {
    const months = payment.planSelected.includes('13') ? 13 : 
                   payment.planSelected.includes('12') ? 12 :
                   payment.planSelected.includes('6') ? 6 :
                   payment.planSelected.includes('3') ? 3 : 1;
    
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + months);

    await updatePaymentStatusInSupabase(payment.id, 'approved');
    await updateOtherUser(payment.userId, { 
      isPremium: true, 
      isTemporaryPremium: false,
      premiumUntil: premiumUntil.toISOString() 
    });
    
    addAdminLog('Payment Approved', `Approved ${months} months for user ${payment.userId}`);
    setPendingPayments(await fetchPendingPaymentsFromSupabase());
    setUsers(await getAllUsers());
  };

  const handleRejectPayment = async (payment: Payment) => {
    await updatePaymentStatusInSupabase(payment.id, 'rejected');
    await updateOtherUser(payment.userId, { 
      isPremium: false, 
      isTemporaryPremium: false,
      premiumUntil: undefined 
    });
    
    addAdminLog('Payment Rejected', `Rejected payment for user ${payment.userId}`);
    setPendingPayments(await fetchPendingPaymentsFromSupabase());
    setUsers(await getAllUsers());
    alert(`Foydalanuvchi rad etildi: Sizning to'lovingiz soxta deb topildi.`);
  };

  const handleAddWord = async () => {
    if (!newWord.term || !newWord.translation) return;
    const item: DictionaryItem = {
      id: `word_${Date.now()}`,
      term: newWord.term!,
      translation: newWord.translation!,
      definition: newWord.definition || '',
      example: newWord.example || '',
      category: newWord.category || 'General'
    };
    saveDictionaryItem(item);
    addAdminLog('Dictionary Update', `Added word: ${item.term}`);
    const items = await getDictionaryItems();
    setDictItems(items);
    setNewWord({ term: '', translation: '', definition: '', example: '', category: 'General' });
  };

  const handleAddDiscount = async () => {
    if (!newDiscount.code) return;
    const discount: Discount = {
      id: `disc_${Date.now()}`,
      code: newDiscount.code!,
      percentage: newDiscount.percentage || 10,
      expiryDate: newDiscount.expiryDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      isActive: true
    };
    saveDiscount(discount);
    addAdminLog('Discount Update', `Created discount: ${discount.code}`);
    const allDiscounts = await getDiscounts();
    setDiscounts(allDiscounts);
    setNewDiscount({ code: '', percentage: 10, expiryDate: '', isActive: true });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNotif({ ...notif, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-white/5 bg-slate-900/40">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Daily Active</p>
          <p className="text-2xl font-black text-white">{analytics?.dailyActiveUsers || 0}</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-white/5 bg-slate-900/40">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Revenue</p>
          <p className="text-2xl font-black text-emerald-400">${analytics?.totalRevenue || 0}</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-white/5 bg-slate-900/40">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">AI Requests</p>
          <p className="text-2xl font-black text-blue-400">{analytics?.aiRequestsCount || 0}</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-white/5 bg-slate-900/40">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Errors</p>
          <p className="text-2xl font-black text-red-400">{analytics?.errorCount || 0}</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-[40px] border border-blue-500/20 bg-blue-500/5">
        <h3 className="font-black text-sm uppercase tracking-widest mb-4">Balansni Tahrirlash</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input type="number" value={starAmt || ''} onChange={(e) => setStarAmt(parseInt(e.target.value) || 0)} placeholder="Stars" className="bg-slate-900 border border-white/10 p-4 rounded-2xl text-center font-black" />
          <input type="number" value={coinAmt || ''} onChange={(e) => setCoinAmt(parseInt(e.target.value) || 0)} placeholder="Coins" className="bg-slate-900 border border-white/10 p-4 rounded-2xl text-center font-black" />
        </div>
        <button onClick={handleUpdateBalances} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs">Saqlash</button>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <h3 className="font-black text-sm uppercase tracking-widest">Foydalanuvchilar ({users.length})</h3>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-900/40 flex justify-between items-center">
            <div>
              <p className="font-black text-white text-sm">{u.name} {u.isPremium && <span className="text-yellow-400 text-[10px]">PREMIUM</span>}</p>
              <p className="text-[10px] text-slate-500">ID: {u.id.slice(-6)} | XP: {u.xp}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleTogglePremium(u.id, !!u.isPremium)} className={`p-2 rounded-lg text-[10px] font-black ${u.isPremium ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-800 text-slate-400'}`}>
                <i className="fa-solid fa-crown"></i>
              </button>
              <button onClick={() => handleToggleBlock(u.id, !!u.isBlocked)} className={`p-2 rounded-lg text-[10px] font-black ${u.isBlocked ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-500'}`}>
                <i className="fa-solid fa-ban"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPremium = () => (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
        <h3 className="font-black text-sm uppercase tracking-widest mb-4">Karta Ma'lumotlari (P2P)</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Karta Raqami</label>
            <input 
              type="text" 
              value={newCardNumber} 
              onChange={(e) => setNewCardNumber(e.target.value)} 
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl font-bold" 
            />
          </div>
          <button onClick={handleSaveAdminConfig} className="w-full py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest text-white">Saqlash</button>
        </div>
      </div>

      <h3 className="font-black text-sm uppercase tracking-widest">Kutilayotgan To'lovlar</h3>
      <div className="space-y-4">
        {pendingPayments.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-8">Hozircha kutilayotgan to'lovlar yo'q.</p>
        )}
        {pendingPayments.map(payment => (
          <div key={payment.id} className="glass-card p-5 rounded-3xl border border-white/5 bg-slate-900/40">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-black text-white">{payment.userName}</p>
                <p className="text-[10px] text-slate-500">ID: {payment.userId.slice(-6)} | {new Date(payment.createdAt).toLocaleString()}</p>
                <p className="text-[10px] text-blue-400 font-bold uppercase mt-1">{payment.planSelected}</p>
              </div>
              <p className="text-emerald-400 font-black">{payment.amount.toLocaleString()} UZS</p>
            </div>
            
            {payment.receiptImageUrl && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => window.open(payment.receiptImageUrl, '_blank')}>
                <img src={payment.receiptImageUrl} alt="Receipt" className="w-full h-auto max-h-64 object-contain bg-black" />
                <p className="text-[8px] text-center text-slate-500 py-1 uppercase font-bold">To'liq ko'rish uchun bosing</p>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => handleApprovePayment(payment)}
                className="flex-1 py-3 bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                Tasdiqlash
              </button>
              <button 
                onClick={() => handleRejectPayment(payment)}
                className="flex-1 py-3 bg-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                Rad Etish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMarketing = () => (
    <div className="space-y-6">
      <div className="glass-card p-7 rounded-[45px] border border-purple-500/20 bg-purple-500/5">
          <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center">
             <i className="fa-solid fa-bullhorn text-purple-400 mr-2"></i> Kirish Banneri
          </h3>
          <div className="space-y-5">
              <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Rasm (Upload)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-xs" />
              </div>
              <input type="text" value={notif.title} onChange={(e) => setNotif({...notif, title: e.target.value})} placeholder="Sarlavha" className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl font-bold" />
              <textarea value={notif.description} onChange={(e) => setNotif({...notif, description: e.target.value})} placeholder="Tavsif" className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-sm h-24" />
              <input type="text" value={notif.buttonText} onChange={(e) => setNotif({...notif, buttonText: e.target.value})} placeholder="Tugma matni" className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl font-bold" />
              <button onClick={handleSaveNotif} className="w-full py-4 bg-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest text-white">Yangilash</button>
          </div>
      </div>
    </div>
  );

  const renderDictionary = () => (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40">
        <h3 className="font-black text-sm uppercase tracking-widest mb-4">Yangi So'z Qo'shish</h3>
        <div className="space-y-3">
          <input type="text" value={newWord.term} onChange={(e) => setNewWord({...newWord, term: e.target.value})} placeholder="So'z (English)" className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-sm" />
          <input type="text" value={newWord.translation} onChange={(e) => setNewWord({...newWord, translation: e.target.value})} placeholder="Tarjima (Uzbek)" className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-sm" />
          <button onClick={handleAddWord} className="w-full py-3 bg-blue-600 rounded-xl font-black text-xs uppercase tracking-widest">Qo'shish</button>
        </div>
      </div>
      <div className="space-y-3">
        {dictItems.map(item => (
          <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between">
            <span className="font-bold text-white">{item.term}</span>
            <span className="text-slate-400">{item.translation}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDiscounts = () => (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40">
        <h3 className="font-black text-sm uppercase tracking-widest mb-4">Chegirma Yaratish</h3>
        <div className="space-y-3">
          <input type="text" value={newDiscount.code} onChange={(e) => setNewDiscount({...newDiscount, code: e.target.value.toUpperCase()})} placeholder="PROMO KOD" className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-sm font-black" />
          <input type="number" value={newDiscount.percentage} onChange={(e) => setNewDiscount({...newDiscount, percentage: parseInt(e.target.value)})} placeholder="Foiz (%)" className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-sm" />
          <button onClick={handleAddDiscount} className="w-full py-3 bg-emerald-600 rounded-xl font-black text-xs uppercase tracking-widest">Yaratish</button>
        </div>
      </div>
      <div className="space-y-3">
        {discounts.map(d => (
          <div key={d.id} className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex justify-between items-center">
            <div>
              <p className="font-black text-emerald-400">{d.code}</p>
              <p className="text-[10px] text-slate-500">{d.percentage}% chegirma</p>
            </div>
            <button onClick={() => deleteDiscount(d.id)} className="text-red-500"><i className="fa-solid fa-trash"></i></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <h3 className="font-black text-sm uppercase tracking-widest">Admin Action Loglari</h3>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="p-3 bg-slate-900/80 border border-white/5 rounded-xl text-[10px]">
            <div className="flex justify-between mb-1">
              <span className="font-black text-blue-400 uppercase">{log.action}</span>
              <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-slate-300">{log.details}</p>
            <p className="text-[8px] text-slate-600 mt-1">IP: {log.ip} | Admin: {log.adminId.slice(-6)}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="p-6 pt-10 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl shrink-0">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Boshqaruv</h1>
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Ravona AI Central Command</p>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 space-y-6 shrink-0 bg-slate-900/20">
          {(['dashboard', 'users', 'premium', 'marketing', 'dictionary', 'discounts', 'security'] as AdminTab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'}`}
            >
              <i className={`fa-solid ${
                tab === 'dashboard' ? 'fa-chart-line' :
                tab === 'users' ? 'fa-users' :
                tab === 'premium' ? 'fa-crown' :
                tab === 'marketing' ? 'fa-bullhorn' :
                tab === 'dictionary' ? 'fa-book' :
                tab === 'discounts' ? 'fa-tag' : 'fa-shield-halved'
              }`}></i>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'premium' && renderPremium()}
          {activeTab === 'marketing' && renderMarketing()}
          {activeTab === 'dictionary' && renderDictionary()}
          {activeTab === 'discounts' && renderDiscounts()}
          {activeTab === 'security' && renderSecurity()}
          <div className="h-24"></div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
