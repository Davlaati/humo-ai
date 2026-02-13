
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { consultWithMentor, playTextToSpeech } from '../services/geminiService';
import { playTapSound } from '../services/audioService';

interface SmartDictionaryProps {
  user: UserProfile;
}

const SmartDictionary: React.FC<SmartDictionaryProps> = ({ user }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    playTapSound();
    setIsLoading(true);
    setResponse(null);
    
    try {
      const result = await consultWithMentor(user, query, 'lookup');
      setResponse(result || "Ma'lumot topilmadi.");
      setHistory(prev => [query, ...prev].slice(0, 5));
    } catch (e) {
      setResponse("Xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDailyWords = async () => {
    playTapSound();
    setIsLoading(true);
    setQuery("Kunlik so'zlar");
    setResponse(null);
    
    try {
      const result = await consultWithMentor(user, '', 'daily');
      setResponse(result || "Bugungi so'zlar tayyorlanmadi.");
    } catch (e) {
      setResponse("Xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Format the markdown-like response for basic display
  const formatResponse = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') || line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={i} className="mb-2">
            {parts.map((part, index) => 
              index % 2 === 1 ? <span key={index} className="font-bold text-yellow-400">{part}</span> : part
            )}
          </p>
        );
      }
      return <p key={i} className="mb-1 text-slate-300">{line}</p>;
    });
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col animate-fade-in relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-emerald-600 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="flex flex-col items-center mb-6 z-10">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 rotate-3">
          <i className="fa-solid fa-book-journal-whills text-3xl text-white"></i>
        </div>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">HUMO MENTOR</h1>
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Aqlli Lug'at</p>
      </div>

      {/* Search Input */}
      <div className="w-full relative z-20 mb-4">
        <div className="glass-panel p-1.5 rounded-[25px] flex items-center bg-slate-800/50 border border-emerald-500/30 focus-within:border-emerald-400 transition-colors shadow-lg">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="So'z, ibora yoki mavzu..." 
            className="bg-transparent w-full px-4 py-3 text-white placeholder-slate-500 font-medium focus:outline-none"
          />
          <button 
            onClick={handleSearch}
            disabled={isLoading}
            className="w-12 h-12 rounded-[20px] bg-emerald-500 text-white flex items-center justify-center active:scale-90 transition shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-3 mb-6 overflow-x-auto pb-2 no-scrollbar z-20">
        <button 
          onClick={handleDailyWords}
          className="flex items-center space-x-2 px-4 py-2 rounded-full glass-card border border-white/5 whitespace-nowrap active:scale-95 transition hover:bg-white/5"
        >
          <i className="fa-solid fa-calendar-day text-yellow-400"></i>
          <span className="text-xs font-bold text-slate-300">Kunlik So'zlar</span>
        </button>
        {history.map((h, i) => (
           <button 
             key={i}
             onClick={() => { setQuery(h); handleSearch(); }}
             className="px-4 py-2 rounded-full glass-card border border-white/5 whitespace-nowrap text-xs text-slate-400 active:scale-95 transition"
           >
             {h}
           </button>
        ))}
      </div>

      {/* Result Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar z-10 relative">
        {response ? (
          <div ref={resultRef} className="glass-card rounded-[35px] p-6 border border-emerald-500/20 bg-slate-900/40 animate-slide-up shadow-xl">
             <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                     <i className="fa-solid fa-robot text-emerald-400"></i>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mentor Javobi</p>
                     <p className="text-xs text-emerald-400 font-bold">Moslashtirilgan</p>
                   </div>
                </div>
                {/* TTS Button if query matches start of response (simple check) */}
                <button 
                  onClick={() => playTextToSpeech(query || response.slice(0, 50))}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition"
                >
                  <i className="fa-solid fa-volume-high text-blue-400"></i>
                </button>
             </div>
             
             <div className="prose prose-invert prose-sm leading-relaxed text-slate-200">
                {formatResponse(response)}
             </div>

             <div className="mt-6 pt-4 border-t border-white/5 flex justify-center">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
                   AI javoblari xato bo'lishi mumkin
                </p>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 opacity-50">
             <i className="fa-solid fa-comment-dots text-6xl mb-4"></i>
             <p className="text-xs font-bold uppercase tracking-widest">So'rang va o'rganing</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default SmartDictionary;
