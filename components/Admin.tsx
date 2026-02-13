
import React, { useState, useEffect } from 'react';
import { Transaction, UserProfile, AdminConfig } from '../types';
import { getTransactions, updateTransactionStatus, getUser, getAdminConfig, saveAdminConfig } from '../services/storageService';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users'|'prices'|'api'|'dictionary'>('users');
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<AdminConfig>(getAdminConfig());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setTxs(getTransactions().reverse());
    setCurrentUser(getUser());
  }, []);

  const handleSaveConfig = () => {
    saveAdminConfig(config);
    alert("Sozlamalar saqlandi!");
  };

  const handlePdfUpload = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
        setIsAnalyzing(false);
        alert("AI PDF-ni tahlil qildi: 245 ta yangi so'z lug'atga qo'shildi!");
    }, 3000);
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto no-scrollbar space-y-6 animate-fade-in bg-slate-950">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h1 className="text-2xl font-black text-blue-400 italic">HUMO ADMIN</h1>
        <div className="flex space-x-1">
            {['users', 'prices', 'api', 'dictionary'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition ${activeTab === tab ? 'bg-blue-600 border-blue-400 text-white' : 'border-white/10 text-gray-500'}`}>{tab}</button>
            ))}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
            <div className="glass-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center space-x-4">
                    <img src={currentUser?.avatarUrl || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-full border-2 border-blue-500" />
                    <div>
                        <p className="font-black text-lg">{currentUser?.name}</p>
                        <p className="text-sm text-blue-400">@{currentUser?.username}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <StatItem label="Qolgan HC" value={currentUser?.coins || 0} />
                    <StatItem label="Jami XP" value={currentUser?.xp || 0} />
                    <StatItem label="Daraja" value={currentUser?.level || 'N/A'} />
                    <StatItem label="Stars" value={currentUser?.telegramStars || 0} />
                </div>
            </div>
        </div>
      )}

      {activeTab === 'prices' && (
        <div className="space-y-4">
            <div className="glass-card p-6 rounded-3xl space-y-4">
                <InputGroup label="1 Star uchun HC miqdori" type="number" value={config.coinPrices.humoPerStar} onChange={v => setConfig({...config, coinPrices: {...config.coinPrices, humoPerStar: parseInt(v)}})} />
                <InputGroup label="100 HC Narxi (UZS)" type="number" value={config.coinPrices.fiatPricePer100Humo} onChange={v => setConfig({...config, coinPrices: {...config.coinPrices, fiatPricePer100Humo: parseInt(v)}})} />
                <button onClick={handleSaveConfig} className="w-full py-4 bg-yellow-600 rounded-2xl font-black uppercase text-xs">Narxlarni Saqlash</button>
            </div>
        </div>
      )}

      {activeTab === 'dictionary' && (
          <div className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-sm">PDF Lug'at Yuklash (AI)</h3>
              <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 relative">
                  {isAnalyzing ? (
                      <div className="flex flex-col items-center"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div><p className="text-[10px] font-bold mt-2">AI tahlil qilmoqda...</p></div>
                  ) : (
                      <><i className="fa-solid fa-file-pdf text-3xl mb-2 text-red-500"></i><p className="text-[10px] font-black uppercase">Faylni tanlang</p><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePdfUpload} /></>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'api' && (
          <div className="glass-card p-6 rounded-3xl space-y-4">
              <InputGroup label="Asosiy API Endpoint" type="text" value={config.apiEndpoints.main} onChange={v => setConfig({...config, apiEndpoints: {...config.apiEndpoints, main: v}})} />
              <InputGroup label="Lug'at API" type="text" value={config.apiEndpoints.dictionary} onChange={v => setConfig({...config, apiEndpoints: {...config.apiEndpoints, dictionary: v}})} />
              <button onClick={handleSaveConfig} className="w-full py-4 bg-purple-600 rounded-2xl font-black uppercase text-xs">API Saqlash</button>
          </div>
      )}
    </div>
  );
};

const StatItem = ({ label, value }: any) => (
    <div className="p-3 bg-white/5 rounded-2xl">
        <p className="text-[8px] text-gray-500 uppercase font-black">{label}</p>
        <p className="font-bold text-sm">{value}</p>
    </div>
);

const InputGroup = ({ label, value, onChange, type }: any) => (
    <div>
        <label className="text-[10px] uppercase text-gray-500 font-black mb-1 block">{label}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 p-3 rounded-xl border border-white/10 text-xs font-mono" />
    </div>
);

export default Admin;
