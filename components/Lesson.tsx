
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Word } from '../types';
import { generateLessonContent, generateFallbackLesson, playTextToSpeech } from '../services/geminiService';
import { playTapSound } from '../services/audioService';
import { addLessonPoints } from '../services/storageService';

interface LessonProps {
  user: UserProfile;
  onUpdateUser?: (user: UserProfile) => void;
}

const Lesson: React.FC<LessonProps> = ({ user, onUpdateUser }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizPhase, setQuizPhase] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  
  // Session Stats
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  
  const hasSavedWords = useRef(false);

  // Swipe State
  const [dragX, setDragX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Tutorial State
  const [showSwipeHelp, setShowSwipeHelp] = useState(true);
  
  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      
      const apiPromise = generateLessonContent(user, user.interests[0] || 'General');
      const timeoutPromise = new Promise<{fallback: boolean, data: any}>((resolve) => {
          setTimeout(() => {
              resolve({ fallback: true, data: generateFallbackLesson() });
          }, 4000);
      });

      const wrappedApiPromise = apiPromise.then(data => ({ fallback: false, data }));

      let result;
      try {
          result = await Promise.race([wrappedApiPromise, timeoutPromise]);
      } catch (e) {
          result = { fallback: true, data: generateFallbackLesson() };
      }

      const data = result.data || generateFallbackLesson();
      setContent(data);
      setLoading(false);
      
      if (data && data.vocab && onUpdateUser && !hasSavedWords.current) {
          const newWords = data.vocab.map((v: any) => ({
             term: v.word,
             definition: v.definition,
             example: v.example,
             translation: v.translation || '',
             mastered: false
          }));

          const existingTerms = new Set((user.learnedWords || []).map(w => w.term.toLowerCase()));
          const uniqueNewWords = newWords.filter((w: any) => !existingTerms.has(w.term.toLowerCase()));

          if (uniqueNewWords.length > 0) {
             const updatedUser = { ...user, learnedWords: [...(user.learnedWords || []), ...uniqueNewWords] };
             onUpdateUser(updatedUser);
             hasSavedWords.current = true;
          }
      }
    };
    fetchLesson();
  }, [user.id]);

  const awardReward = (reason: string, coins: number = 5, xp: number = 5) => {
    setSessionXP(prev => prev + xp);
    setSessionCoins(prev => prev + coins);
    if (onUpdateUser) {
      const updatedUser = addLessonPoints({
        ...user,
        coins: user.coins + coins,
        xp: user.xp + xp
      }, xp);
      onUpdateUser(updatedUser);
      setRewardMessage(`+${coins} HC & +${xp} XP: ${reason}`);
      setTimeout(() => setRewardMessage(null), 2000);
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      if (isFinished || quizPhase) return;
      if (showSwipeHelp) setShowSwipeHelp(false);
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      setStartX(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      setDragX(clientX - startX);
  };

  const handleTouchEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (Math.abs(dragX) > 100) {
          const direction = dragX > 0 ? 'right' : 'left';
          handleSwipe(direction);
      } else {
          if (Math.abs(dragX) < 5) {
              setFlipped(!flipped);
          }
          setDragX(0);
      }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
      if (showSwipeHelp) setShowSwipeHelp(false);
      setFlipped(false);
      setDragX(0);
      
      if (direction === 'right') {
          awardReward("O'zlashtirildi!");
          if (onUpdateUser) {
              const currentWordTerm = content.vocab[currentIndex].word;
              const updatedLearnedWords = (user.learnedWords || []).map(w => 
                w.term.toLowerCase() === currentWordTerm.toLowerCase() ? { ...w, mastered: true } : w
              );
              onUpdateUser({ ...user, learnedWords: updatedLearnedWords });
          }
      }

      if (currentIndex + 1 >= content.vocab.length) {
          setQuizPhase(true);
      } else {
          setCurrentIndex(prev => prev + 1);
      }
  };

  const handleQuizAnswer = (index: number) => {
      if (quizAnswered !== null) return;
      setQuizAnswered(index);
      
      const correct = content.quiz.options[index] === content.quiz.answer;
      if (correct) {
          awardReward("To'g'ri javob!", 15, 20);
          playTapSound();
      }
      
      setTimeout(() => {
          setCurrentIndex(content.vocab.length + 1); 
      }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="text-gray-400 animate-pulse font-medium uppercase text-[10px] tracking-widest">Dars tayyorlanmoqda...</p>
      </div>
    );
  }

  if (!content || !content.vocab) {
      return <div className="p-8 text-center">Dars yuklanmadi. Qayta urining.</div>;
  }

  const isFinished = currentIndex > content.vocab.length;

  if (isFinished) {
      return (
          <div className="p-6 h-full flex flex-col items-center pb-24 animate-fade-in overflow-y-auto no-scrollbar bg-[#0c1222] relative">
              {/* Confetti Particles Rain */}
              <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                  {Array.from({ length: 40 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute w-2 h-4 rounded-sm animate-celebrate-fall opacity-80"
                        style={{ 
                            left: `${Math.random() * 100}%`, 
                            top: `-20px`, 
                            backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#f87171', '#a855f7'][i % 5],
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2.5 + Math.random() * 2}s`
                        }}
                      ></div>
                  ))}
              </div>

              {/* Success Visual */}
              <div className="relative mt-12 mb-10 z-10">
                <div className="absolute inset-0 bg-yellow-500 rounded-full blur-[80px] opacity-20 animate-pulse"></div>
                <div className="w-32 h-32 bg-gradient-to-tr from-yellow-400 via-orange-500 to-yellow-600 rounded-[40px] flex items-center justify-center text-white text-6xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] border-4 border-yellow-200 animate-bounce-slow relative z-10">
                    <i className="fa-solid fa-trophy drop-shadow-lg"></i>
                </div>
              </div>

              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2 z-10 text-center">G'OYAT AJOYIB!</h2>
              <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-12 z-10">Dars muvaffaqiyatli yakunlandi</p>

              {/* Rewards Summary Badges */}
              <div className="grid grid-cols-2 gap-4 w-full mb-10 z-10">
                  <div className="glass-card p-6 rounded-[35px] border border-blue-500/20 bg-blue-500/5 flex flex-col items-center shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                        <i className="fa-solid fa-bolt text-blue-400 text-lg"></i>
                      </div>
                      <span className="text-3xl font-black text-white">{sessionXP}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">XP ISHLANDI</span>
                  </div>
                  <div className="glass-card p-6 rounded-[35px] border border-yellow-500/20 bg-yellow-500/5 flex flex-col items-center shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3">
                        <i className="fa-solid fa-coins text-yellow-500 text-lg"></i>
                      </div>
                      <span className="text-3xl font-black text-white">{sessionCoins}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">HC ISHLANDI</span>
                  </div>
              </div>

              {/* Vocabulary Recap */}
              <div className="w-full glass-panel rounded-[45px] p-8 mb-12 border border-white/10 shadow-2xl z-10 relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <i className="fa-solid fa-book-open-reader text-6xl text-blue-400"></i>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Yangi so'zlar lug'ati
                  </h3>
                  <div className="space-y-4">
                      {content.vocab.map((v: any, i: number) => (
                          <div key={i} className="flex items-center space-x-4 animate-fade-in" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 text-sm font-black border border-white/5">
                                  {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-white uppercase tracking-tighter truncate">{v.word}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{v.translation}</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                  <i className="fa-solid fa-check text-green-500 text-xs"></i>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-6 rounded-[30px] liquid-button font-black text-xl shadow-[0_15px_40px_rgba(59,130,246,0.4)] uppercase tracking-[0.2em] active:scale-95 transition-all z-10"
              >
                DAVOM ETISH
              </button>
              
              <style>{`
                @keyframes celebrate-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
                .animate-celebrate-fall {
                    animation: celebrate-fall linear forwards;
                }
              `}</style>
          </div>
      )
  }

  if (quizPhase && currentIndex === content.vocab.length) {
      return (
          <div className="p-6 h-full flex flex-col items-center pb-24 animate-slide-up relative">
              <div className="absolute top-4 left-0 right-0 flex justify-center z-50">
                {rewardMessage && (
                  <div className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg animate-bounce text-sm">
                    {rewardMessage}
                  </div>
                )}
              </div>

              <div className="w-full flex justify-between items-center mb-6 z-10">
                <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Final Challenge</span>
                <span className="text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">Bilimingizni sinang</span>
              </div>

              <div className="w-full glass-card rounded-3xl p-8 flex flex-col items-center border-t border-white/20 mb-8 shadow-2xl bg-slate-800/20">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                      <i className="fa-solid fa-graduation-cap text-2xl text-blue-400"></i>
                  </div>
                  <h2 className="text-2xl font-black text-center italic tracking-tighter leading-tight mb-8 text-white uppercase">
                      {content.quiz.question}
                  </h2>
                  <div className="space-y-3 w-full">
                      {content.quiz.options.map((option: string, idx: number) => {
                          const isSelected = quizAnswered === idx;
                          const isCorrect = option === content.quiz.answer;
                          let btnClass = "w-full py-5 px-6 rounded-2xl text-left font-bold transition-all active:scale-[0.98] flex items-center border ";
                          
                          if (quizAnswered !== null) {
                              if (isCorrect) btnClass += "bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]";
                              else if (isSelected) btnClass += "bg-red-600 border-red-400 text-white";
                              else btnClass += "bg-white/5 border-white/5 text-slate-500 opacity-50";
                          } else {
                              btnClass += "glass-card hover:bg-white/10 text-slate-300 border-white/5";
                          }

                          return (
                              <button 
                                key={idx}
                                onClick={() => handleQuizAnswer(idx)}
                                className={btnClass}
                              >
                                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-4 text-[10px] font-black shrink-0">
                                      {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="text-xs uppercase tracking-tight">{option}</span>
                                  {quizAnswered !== null && isCorrect && <i className="fa-solid fa-check ml-auto text-white"></i>}
                                  {quizAnswered !== null && isSelected && !isCorrect && <i className="fa-solid fa-xmark ml-auto text-white"></i>}
                              </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  const currentWord = content.vocab[currentIndex];
  const nextWord = currentIndex + 1 < content.vocab.length ? content.vocab[currentIndex + 1] : null;

  const rotateDeg = dragX * 0.05;
  const opacityInput = Math.min(Math.abs(dragX) / 200, 1);
  const borderColor = dragX > 0 ? `rgba(74, 222, 128, ${opacityInput})` : `rgba(248, 113, 113, ${opacityInput})`;

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col items-center pb-28 sm:pb-24 relative overflow-hidden">
       <div className="absolute top-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
        {rewardMessage && (
          <div className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg animate-bounce text-sm">
            {rewardMessage}
          </div>
        )}
       </div>

       <div className="w-full flex justify-between items-center mb-6 z-10">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">SO'Z {currentIndex + 1} / {content.vocab.length}</span>
          <div className="flex space-x-1.5">
             {content.vocab.map((_: any, i: number) => (
                 <div key={i} className={`h-1.5 w-4 rounded-full transition-all duration-300 ${i <= currentIndex ? 'bg-blue-500 w-8 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-700'}`}></div>
             ))}
          </div>
       </div>

       {showSwipeHelp && currentIndex === 0 && !isDragging && (
           <div 
             className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
             style={{ animation: 'fadeIn 0.5s ease-out' }}
           >
               <div className="relative w-full aspect-[3/4] max-w-sm flex items-center justify-between px-8">
                   <div className="flex flex-col items-center opacity-80 animate-pulse">
                       <i className="fa-solid fa-arrow-left text-3xl text-red-400 mb-2"></i>
                       <span className="font-black text-red-400 bg-black/40 px-3 py-1.5 rounded-xl text-[10px] uppercase">Qiyin</span>
                   </div>
                   
                   <div className="flex flex-col items-center animate-hand-swipe absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                       <i className="fa-regular fa-hand-pointer text-5xl text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]"></i>
                       <span className="text-[10px] mt-4 bg-black/60 px-4 py-2 rounded-full text-white font-black uppercase tracking-widest border border-white/10 backdrop-blur-md">Baholash uchun suring</span>
                   </div>

                   <div className="flex flex-col items-center opacity-80 animate-pulse">
                       <span className="font-black text-green-400 bg-black/40 px-3 py-1.5 rounded-xl mb-2 text-[10px] uppercase">Oson</span>
                       <i className="fa-solid fa-arrow-right text-3xl text-green-400"></i>
                   </div>
               </div>
           </div>
       )}

       <div className="relative w-full aspect-[3/4] flex items-center justify-center mt-4">
           {nextWord && (
               <div className="absolute top-4 w-[95%] h-full glass-card rounded-[45px] opacity-20 transform scale-95 translate-y-8 border border-white/5 z-0 blur-[3px]">
                  <div className="w-full h-full flex items-center justify-center p-8">
                       <h2 className="text-4xl font-black text-slate-500 uppercase italic tracking-tighter">{nextWord.word}</h2>
                  </div>
               </div>
           )}

           <div 
             className="absolute w-full h-full z-10 perspective-1000 cursor-grab active:cursor-grabbing"
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
             onMouseDown={handleTouchStart}
             onMouseMove={handleTouchMove}
             onMouseUp={handleTouchEnd}
             onMouseLeave={handleTouchEnd}
             style={{ 
                 transform: `translateX(${dragX}px) rotate(${rotateDeg}deg)`,
                 transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
             }}
           >
              <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${flipped ? 'rotate-y-180' : ''}`}>
                
                <div 
                    className="absolute w-full h-full backface-hidden glass-card rounded-[50px] flex flex-col items-center justify-center p-8 border-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)] bg-slate-800/90"
                    style={{ borderColor: isDragging ? borderColor : 'rgba(59, 130, 246, 0.15)' }}
                >
                    {dragX > 50 && (
                        <div className="absolute top-10 right-10 bg-green-500 text-white px-6 py-2 rounded-full font-black text-xs shadow-xl transform rotate-12 z-20 uppercase tracking-widest">OSON</div>
                    )}
                    {dragX < -50 && (
                        <div className="absolute top-10 left-10 bg-red-500 text-white px-6 py-2 rounded-full font-black text-xs shadow-xl transform -rotate-12 z-20 uppercase tracking-widest">QIYIN</div>
                    )}

                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-5 py-2 rounded-full mb-10 font-black tracking-widest uppercase border border-blue-500/20">Learning Mode</span>
                    <h2 className="text-6xl font-black mb-8 text-center italic tracking-tighter text-white drop-shadow-2xl uppercase break-all">{currentWord.word}</h2>
                    <button 
                        onTouchEnd={(e) => { e.stopPropagation(); playTextToSpeech(currentWord.word); }}
                        onClick={(e) => { e.stopPropagation(); playTextToSpeech(currentWord.word); }}
                        className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition active:scale-95 border border-white/10 shadow-inner group"
                    >
                        <i className="fa-solid fa-volume-high text-3xl text-blue-400 group-hover:scale-110 transition-transform"></i>
                    </button>
                    <p className="mt-14 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Tarjimani ko'rish uchun bosing</p>
                </div>

                <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-card rounded-[50px] flex flex-col p-10 bg-slate-900 border-4 border-blue-500/30 overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                    <div className="flex flex-col items-center mb-8">
                        <span className="text-[10px] font-black text-blue-400 mb-2 tracking-[0.4em] uppercase">Tarjimasi</span>
                        <h2 className="text-4xl font-black text-yellow-400 text-center italic tracking-tighter uppercase">{currentWord.translation}</h2>
                        <span className="text-slate-500 text-[11px] mt-2 font-bold italic tracking-wide">({currentWord.word})</span>
                    </div>

                    <div className="flex-1 flex flex-col space-y-6">
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 shadow-inner">
                            <h3 className="text-[9px] font-black text-purple-400 mb-2 tracking-[0.3em] uppercase">Definition</h3>
                            <p className="text-[13px] font-medium leading-relaxed text-slate-300 italic">"{currentWord.definition}"</p>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                            <h3 className="text-[9px] font-black text-blue-400 mb-2 tracking-[0.3em] uppercase pl-2">Usage Example</h3>
                            <p className="text-[13px] font-black italic text-slate-200 pl-2 leading-relaxed">"{currentWord.example}"</p>
                        </div>
                    </div>
                    
                    <button 
                        onTouchEnd={(e) => { e.stopPropagation(); setFlipped(false); }}
                        onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
                        className="mt-6 py-4 text-[10px] font-black text-slate-500 hover:text-white transition uppercase tracking-[0.3em] border-t border-white/5"
                    >
                        Yopish
                    </button>
                </div>

              </div>
           </div>
       </div>

       <div className="absolute bottom-20 sm:bottom-24 flex items-center justify-center space-x-8 sm:space-x-12 z-20">
           <button 
             onClick={() => handleSwipe('left')}
             className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/90 border-b-[6px] border-red-700 text-red-500 shadow-2xl flex items-center justify-center text-3xl active:translate-y-1 active:border-b-0 transition-all duration-150 backdrop-blur-xl border border-white/5"
           >
             <i className="fa-solid fa-xmark"></i>
           </button>
           
           <button 
             onClick={() => handleSwipe('right')}
             className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/90 border-b-[6px] border-green-700 text-green-400 shadow-2xl flex items-center justify-center text-3xl active:translate-y-1 active:border-b-0 transition-all duration-150 backdrop-blur-xl border border-white/5"
           >
             <i className="fa-solid fa-check"></i>
           </button>
       </div>
    </div>
  );
};

export default Lesson;
