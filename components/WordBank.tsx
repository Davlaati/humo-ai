
import React, { useState, useMemo } from 'react';
import { UserProfile, Word } from '../types';
import { getDictionaryDefinition, playTextToSpeech } from '../services/geminiService';
import { DICTIONARY } from '../data/dictionary';

interface WordBankProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const WordBank: React.FC<WordBankProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'learn' | 'mastered' | 'dictionary'>('dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Intelligence: Filter local DICTIONARY by user level and interests
  const recommendations = useMemo(() => {
    return DICTIONARY.filter(w => {
        const isLevelMatch = w.level === user.level || !w.level;
        const isInterestMatch = user.interests.some(i => w.category?.toLowerCase() === i.toLowerCase());
        return isLevelMatch && (isInterestMatch || !w.category);
    }).slice(0, 40);
  }, [user.level, user.interests]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setAiResult(null);

    const localMatch = DICTIONARY.find(w => w.term.toLowerCase() === searchQuery.toLowerCase());
    if (localMatch) {
      setAiResult({ ...localMatch, term: searchQuery });
      setLoading(false);
    } else {
      const res = await getDictionaryDefinition(searchQuery);
      if (res) setAiResult({ term: searchQuery, ...res });
      setLoading(false);
    }
  };

  const addWord = (word: any) => {
    const words = user.learnedWords || [];
    if (words.some(w => w.term.toLowerCase() === word.term.toLowerCase())) {
        alert("Bu so'z lug'atingizda bor!");
        return;
    }
    onUpdateUser({ ...user, learnedWords: [...words, { ...word, mastered: false }] });
    alert("Saqlandi!");
  };

  const toggleMastery = (term: string) => {
    const words = (user.learnedWords || []).map(w => w.term === term ? { ...w, mastered: !w.mastered } : w);
    onUpdateUser({ ...user, learnedWords: words });
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col animate-slide-up bg-slate-900">
       <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black italic uppercase text-blue-400 tracking-tighter">Humo Dictionary</h1>
          <div className="text-[10px] bg-blue-500/20 px-3 py-1 rounded-full font-black text-blue-300 uppercase">{user.level}</div>
       </div>

       <div className="flex p-1 bg-white/5 rounded-2xl mb-6 border border-white/5">
          {['dictionary', 'learn', 'mastered'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>
               {tab === 'dictionary' ? 'Qidiruv' : tab === 'learn' ? 'O\'rganish' : 'Yodlandi'}
            </button>
          ))}
       </div>

       {activeTab === 'dictionary' && (
           <div className="space-y-6">
               <form onSubmit={handleSearch} className="relative">
                   <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="So'z yoki ibora..." className="w-full bg-slate-800 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-blue-500 font-bold pr-12" />
                   <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400">
                       {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-search"></i>}
                   </button>
               </form>

               {aiResult && (
                   <div className="glass-card p-6 rounded-[32px] border border-blue-500/30 animate-slide-up relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                       <div className="flex justify-between items-start mb-4">
                           <div>
                               <h3 className="text-3xl font-black text-white">{aiResult.term}</h3>
                               <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest">{aiResult.translation}</p>
                           </div>
                           <button onClick={() => playTextToSpeech(aiResult.term)} className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20 active:scale-90"><i className="fa-solid fa-volume-high"></i></button>
                       </div>
                       <p className="text-gray-400 text-sm mb-6 leading-relaxed italic">"{aiResult.definition}"</p>
                       <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/5">
                           <p className="text-[10px] uppercase font-black text-gray-500 mb-1">Misol:</p>
                           <p className="text-xs text-gray-300 italic">{aiResult.example}</p>
                       </div>
                       <button onClick={() => addWord(aiResult)} className="w-full py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition">Lug'atga Qo'shish</button>
                   </div>
               )}

               {!aiResult && (
                   <div className="space-y-4">
                       <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-2">Siz uchun tavsiyalar</h4>
                       <div className="grid grid-cols-1 gap-2">
                           {recommendations.map((w, i) => (
                               <div key={i} className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/10 transition" onClick={() => { setSearchQuery(w.term); setAiResult(w); }}>
                                   <div>
                                       <p className="font-bold text-white text-sm">{w.term}</p>
                                       <p className="text-[10px] text-gray-500 font-bold uppercase">{w.translation}</p>
                                   </div>
                                   <i className="fa-solid fa-chevron-right text-blue-500 text-xs"></i>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
           </div>
       )}

       {activeTab !== 'dictionary' && (
           <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
              {(user.learnedWords || []).filter(w => activeTab === 'learn' ? !w.mastered : w.mastered).map((word, idx) => (
                  <div key={idx} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5">
                      <div className="flex-1">
                          <div className="flex items-center space-x-2">
                             <h3 className="font-bold text-lg text-white">{word.term}</h3>
                             <button onClick={() => playTextToSpeech(word.term)} className="text-blue-400 text-[10px] w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><i className="fa-solid fa-volume-high"></i></button>
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{word.translation}</p>
                      </div>
                      <button onClick={() => toggleMastery(word.term)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${word.mastered ? 'bg-green-500 text-white' : 'bg-slate-800 text-gray-500'}`}>
                          <i className={`fa-solid ${word.mastered ? 'fa-check' : 'fa-graduation-cap'}`}></i>
                      </button>
                  </div>
              ))}
           </div>
       )}
    </div>
  );
};

export default WordBank;
