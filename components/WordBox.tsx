
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronLeft, 
  BookOpen, 
  Star, 
  CheckCircle2, 
  Volume2, 
  Trophy, 
  Zap,
  ArrowRight,
  Filter,
  Layers
} from 'lucide-react';
import { wordBoxCategories, WordBoxCategory, WordBoxItem } from '../data/wordBoxData';
import { UserProfile } from '../types';
import { playTapSound, playSuccessSound } from '../services/audioService';
import { playTextToSpeech } from '../services/geminiService';

interface WordBoxProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onNavigate: (tab: string) => void;
}

const WordBox: React.FC<WordBoxProps> = ({ user, onUpdateUser, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<WordBoxCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'flashcards'>('list');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return wordBoxCategories;
    return wordBoxCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredWords = useMemo(() => {
    if (!selectedCategory) return [];
    if (!searchQuery) return selectedCategory.words;
    return selectedCategory.words.filter(word => 
      word.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.uz.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedCategory, searchQuery]);

  const handleCategoryClick = (category: WordBoxCategory) => {
    playTapSound();
    setSelectedCategory(category);
    setSearchQuery('');
    setViewMode('list');
  };

  const handleBack = () => {
    playTapSound();
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      onNavigate('home');
    }
  };

  const toggleMastery = (word: WordBoxItem) => {
    playTapSound();
    const isMastered = user.learnedWords?.some(w => w.term === word.en && w.mastered);
    
    let newLearnedWords = [...(user.learnedWords || [])];
    const existingIndex = newLearnedWords.findIndex(w => w.term === word.en);

    if (existingIndex >= 0) {
      newLearnedWords[existingIndex] = {
        ...newLearnedWords[existingIndex],
        mastered: !isMastered
      };
    } else {
      newLearnedWords.push({
        term: word.en,
        definition: word.uz,
        example: word.example || '',
        translation: word.uz,
        mastered: true
      });
    }

    onUpdateUser({
      ...user,
      learnedWords: newLearnedWords,
      xp: user.xp + (isMastered ? 0 : 5),
      coins: user.coins + (isMastered ? 0 : 1)
    });

    if (!isMastered) playSuccessSound();
  };

  const handleSpeak = (text: string) => {
    playTapSound();
    playTextToSpeech(text);
  };

  const nextFlashcard = () => {
    playTapSound();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentFlashcardIndex((prev) => (prev + 1) % (selectedCategory?.words.length || 1));
    }, 150);
  };

  const prevFlashcard = () => {
    playTapSound();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentFlashcardIndex((prev) => (prev - 1 + (selectedCategory?.words.length || 1)) % (selectedCategory?.words.length || 1));
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#060b1d] text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#060b1d]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tighter">
              {selectedCategory ? selectedCategory.name : 'Word Box'}
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {selectedCategory ? `${selectedCategory.totalCount} so'z mavjud` : 'Mukammal Lug\'at'}
            </p>
          </div>
        </div>
        
        {!selectedCategory && (
          <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-black text-blue-400">{user.xp} XP</span>
          </div>
        )}

        {selectedCategory && (
          <button 
            onClick={() => {
              playTapSound();
              setViewMode(viewMode === 'list' ? 'flashcards' : 'list');
            }}
            className="px-4 py-2 bg-blue-500 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            {viewMode === 'list' ? 'Flashcards' : 'Ro\'yxat'}
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder={selectedCategory ? "So'zlarni qidirish..." : "Kategoriyalarni qidirish..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div 
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 grid grid-cols-1 gap-4"
          >
            {filteredCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategoryClick(category)}
                className={`relative overflow-hidden p-5 rounded-[32px] bg-gradient-to-br ${category.color} group active:scale-[0.98] transition-all text-left shadow-xl`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="text-8xl">{category.icon}</span>
                </div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-4 shadow-inner">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mb-1">{category.name}</h3>
                  <p className="text-white/70 text-xs font-medium mb-4 line-clamp-1">{category.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      <Layers className="w-3 h-3 text-white/70" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{category.totalCount} so'z</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="words"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4"
          >
            {viewMode === 'list' ? (
              <div className="space-y-3">
                {filteredWords.map((word, index) => {
                  const isMastered = user.learnedWords?.some(w => w.term === word.en && w.mastered);
                  return (
                    <motion.div
                      key={word.en}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-black tracking-tight text-white">{word.en}</h4>
                          <button 
                            onClick={() => handleSpeak(word.en)}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">{word.uz}</p>
                        {word.example && (
                          <p className="text-[10px] text-slate-500 italic mt-1 font-medium">"{word.example}"</p>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => toggleMastery(word)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isMastered 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                            : 'bg-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 ${isMastered ? 'animate-bounce' : ''}`} />
                      </button>
                    </motion.div>
                  );
                })}
                
                {filteredWords.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-500 font-bold">So'zlar topilmadi</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center">
                <div className="w-full max-w-sm perspective-1000">
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full aspect-[3/4] cursor-pointer preserve-3d"
                  >
                    {/* Front */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${selectedCategory.color} rounded-[40px] p-8 flex flex-col items-center justify-center text-center backface-hidden shadow-2xl border-4 border-white/20`}>
                      <div className="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                        {selectedCategory.icon}
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tighter mb-4">
                        {selectedCategory.words[currentFlashcardIndex].en}
                      </h2>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(selectedCategory.words[currentFlashcardIndex].en);
                        }}
                        className="p-4 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                      <p className="absolute bottom-8 text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">
                        Tarjimani ko'rish uchun bosing
                      </p>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 bg-white rounded-[40px] p-8 flex flex-col items-center justify-center text-center backface-hidden shadow-2xl border-4 border-blue-500/20 [transform:rotateY(180deg)]">
                      <h2 className="text-4xl font-black text-blue-600 tracking-tighter mb-4">
                        {selectedCategory.words[currentFlashcardIndex].uz}
                      </h2>
                      {selectedCategory.words[currentFlashcardIndex].example && (
                        <p className="text-slate-500 text-sm font-medium italic px-4">
                          "{selectedCategory.words[currentFlashcardIndex].example}"
                        </p>
                      )}
                      <p className="absolute bottom-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        Asliga qaytish uchun bosing
                      </p>
                    </div>
                  </motion.div>
                </div>

                <div className="flex items-center gap-6 mt-12">
                  <button 
                    onClick={prevFlashcard}
                    className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  
                  <div className="text-center">
                    <span className="text-2xl font-black text-white">{currentFlashcardIndex + 1}</span>
                    <span className="text-slate-500 font-bold mx-2">/</span>
                    <span className="text-slate-500 font-bold">{selectedCategory.words.length}</span>
                  </div>

                  <button 
                    onClick={nextFlashcard}
                    className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 transition-transform"
                  >
                    <ArrowRight className="w-8 h-8" />
                  </button>
                </div>

                <div className="mt-12 flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                    Flashcardlar orqali tezroq o'rganing!
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}} />
    </div>
  );
};

export default WordBox;
