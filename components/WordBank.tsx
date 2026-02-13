import React, { useState } from 'react';
import { UserProfile, Word } from '../types';
import { playTextToSpeech } from '../services/geminiService';

interface WordBankProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const WordBank: React.FC<WordBankProps> = ({ user, onUpdateUser }) => {
  const [filter, setFilter] = useState<'learning' | 'mastered'>('learning');
  
  const words = user.learnedWords || [];
  const learningWords = words.filter(w => !w.mastered);
  const masteredWords = words.filter(w => w.mastered);
  
  const displayWords = filter === 'learning' ? learningWords : masteredWords;

  const toggleMastery = (term: string) => {
    const newWords = words.map(w => {
        if (w.term === term) {
            return { ...w, mastered: !w.mastered };
        }
        return w;
    });
    onUpdateUser({ ...user, learnedWords: newWords });
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col animate-slide-up">
       <h1 className="text-2xl font-bold mb-4">Mening So'zlarim</h1>
       
       {/* Tabs */}
       <div className="flex p-1 bg-white/10 rounded-xl mb-6">
          <button 
            onClick={() => setFilter('learning')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${filter === 'learning' ? 'bg-blue-500 shadow-lg' : 'text-gray-400'}`}
          >
             O'rganilmoqda ({learningWords.length})
          </button>
          <button 
            onClick={() => setFilter('mastered')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${filter === 'mastered' ? 'bg-green-500 shadow-lg' : 'text-gray-400'}`}
          >
             Yodlandi ({masteredWords.length})
          </button>
       </div>

       {/* List */}
       <div className="flex-1 overflow-y-auto space-y-3">
          {displayWords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <i className="fa-solid fa-box-open text-4xl mb-3 opacity-50"></i>
                  <p>Hozircha so'z yo'q.</p>
                  {filter === 'learning' && <p className="text-xs">So'z qo'shish uchun dars boshlang!</p>}
              </div>
          ) : (
              displayWords.map((word, idx) => (
                  <div key={idx} className="glass-card p-4 rounded-xl flex items-center justify-between border border-white/5">
                      <div className="flex-1">
                          <div className="flex items-center space-x-2">
                             <h3 className="font-bold text-lg">{word.term}</h3>
                             <button onClick={() => playTextToSpeech(word.term)} className="text-blue-400 text-xs w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                <i className="fa-solid fa-volume-high"></i>
                             </button>
                          </div>
                          <p className="text-sm text-gray-400">{word.translation || 'Tarjima yo\'q'}</p>
                          <p className="text-xs text-gray-500 italic mt-1 truncate max-w-[200px]">"{word.example}"</p>
                      </div>
                      
                      <button 
                        onClick={() => toggleMastery(word.term)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90 ${word.mastered ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-white/10 text-gray-400 border border-white/20'}`}
                      >
                          <i className={`fa-solid ${word.mastered ? 'fa-check' : 'fa-graduation-cap'}`}></i>
                      </button>
                  </div>
              ))
          )}
       </div>
    </div>
  );
};

export default WordBank;