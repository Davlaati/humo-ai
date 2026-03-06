import React, { useState } from 'react';
import { UserProfile } from '../types';
import { playTapSound } from '../services/audioService';
import { getTranslation } from '../translations';

interface GrammarAnalyzerProps {
  user: UserProfile;
  onNavigate?: (tab: string) => void;
}

const GrammarAnalyzer: React.FC<GrammarAnalyzerProps> = ({ user, onNavigate }) => {
  const [inputText, setInputText] = useState('');
  const [feedback, setFeedback] = useState('');
  const lang = user.settings?.language || 'Uz';

  const handleAnalyze = () => {
    playTapSound();
    if (!inputText.trim()) return;

    // Simple algorithmic grammar check
    let newFeedback = 'Matn tahlil qilindi: ';
    const text = inputText.toLowerCase();

    if (text.includes('i goes')) {
      newFeedback += 'Xato: "I goes" emas, "I go" bo\'lishi kerak.';
    } else if (text.includes('he go')) {
      newFeedback += 'Xato: "He go" emas, "He goes" bo\'lishi kerak.';
    } else if (text.split(' ').length < 3) {
      newFeedback += 'Matn juda qisqa, biroz ko\'proq yozing.';
    } else {
      newFeedback += 'Grammatika yaxshi ko\'rinadi!';
    }

    setFeedback(newFeedback);
  };

  return (
    <div className="p-5 pb-32 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">{getTranslation('grammar_check', lang)}</h1>
        <button onClick={() => { playTapSound(); onNavigate?.('home'); }} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left text-slate-400"></i>
        </button>
      </div>

      <textarea 
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Inglizcha matn kiriting..."
        className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-[30px] p-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 transition-all min-h-[150px] text-lg font-medium"
      />

      <button 
        onClick={handleAnalyze}
        className="w-full py-5 rounded-[25px] bg-green-600 text-white font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl"
      >
        Tahlil qilish
      </button>

      {feedback && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-[30px] p-6 text-green-100">
          {feedback}
        </div>
      )}
    </div>
  );
};

export default GrammarAnalyzer;
