
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Word } from '../types';
import { generateLessonContent, generateFallbackLesson, playTextToSpeech } from '../services/geminiService';

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
          }, 3000);
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
    if (onUpdateUser) {
      const updatedUser = {
        ...user,
        coins: user.coins + coins,
        xp: user.xp + xp
      };
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
          awardReward("To'g'ri javob!");
      }
      
      setTimeout(() => {
          setCurrentIndex(content.vocab.length + 1); 
      }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="text-gray-400 animate-pulse font-medium">Shaxsiy dars tayyorlanmoqda...</p>
      </div>
    );
  }

  if (!content || !content.vocab) {
      return <div className="p-8 text-center">Dars yuklanmadi. Qayta urining.</div>;
  }

  const isFinished = currentIndex > content.vocab.length;

  if (isFinished) {
      return (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center animate-slide-up">
              <i className="fa-solid fa-circle-check text-7xl text-green-400 mb-6 drop-shadow-lg"></i>
              <h2 className="text-3xl font-bold mb-2">Dars Yakunlandi!</h2>
              <p className="text-gray-400 mb-8">Siz bugungi mavzuni a'lo darajada o'zlashtirdingiz. {content.vocab.length} ta yangi so'z!</p>
              <button onClick={() => window.location.reload()} className="liquid-button px-10 py-4 rounded-2xl font-bold text-lg">Keyingi Dars</button>
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
                <span className="text-gray-400 text-sm font-semibold">Yakuniy Test</span>
                <span className="text-blue-400 font-bold uppercase tracking-wider text-[10px]">Bilimingizni sinang</span>
              </div>

              <div className="w-full glass-card rounded-3xl p-8 flex flex-col items-center border-t border-white/20 mb-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                      <i className="fa-solid fa-graduation-cap text-2xl text-blue-400"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-center leading-tight mb-8">
                      {content.quiz.question}
                  </h2>
                  <div className="space-y-3 w-full">
                      {content.quiz.options.map((option: string, idx: number) => {
                          const isSelected = quizAnswered === idx;
                          const isCorrect = option === content.quiz.answer;
                          let btnClass = "w-full py-4 px-6 rounded-2xl text-left font-medium transition-all active:scale-[0.98] flex items-center ";
                          
                          if (quizAnswered !== null) {
                              if (isCorrect) btnClass += "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                              else if (isSelected) btnClass += "bg-red-500 text-white";
                              else btnClass += "bg-white/5 text-gray-500 opacity-50";
                          } else {
                              btnClass += "glass-card hover:bg-white/10 text-white border border-white/5";
                          }

                          return (
                              <button 
                                key={idx}
                                onClick={() => handleQuizAnswer(idx)}
                                className={btnClass}
                              >
                                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 text-xs font-bold shrink-0">
                                      {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="text-sm">{option}</span>
                                  {quizAnswered !== null && isCorrect && <i className="fa-solid fa-check ml-auto"></i>}
                                  {quizAnswered !== null && isSelected && !isCorrect && <i className="fa-solid fa-xmark ml-auto"></i>}
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
    <div className="p-6 h-full flex flex-col items-center pb-24 relative overflow-hidden">
       <div className="absolute top-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
        {rewardMessage && (
          <div className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg animate-bounce text-sm">
            {rewardMessage}
          </div>
        )}
       </div>

       <div className="w-full flex justify-between items-center mb-6 z-10">
          <span className="text-gray-400 text-sm font-bold">So'z {currentIndex + 1} / {content.vocab.length}</span>
          <div className="flex space-x-1">
             {content.vocab.map((_: any, i: number) => (
                 <div key={i} className={`h-1.5 w-4 rounded-full transition-all duration-300 ${i <= currentIndex ? 'bg-blue-500 w-6' : 'bg-gray-700'}`}></div>
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
                       <span className="font-bold text-red-400 bg-black/40 px-2 py-1 rounded text-[10px]">Qiyin</span>
                   </div>
                   
                   <div className="flex flex-col items-center animate-hand-swipe absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                       <i className="fa-regular fa-hand-pointer text-5xl text-white drop-shadow-lg"></i>
                       <span className="text-[10px] mt-4 bg-black/40 px-3 py-1 rounded-full text-white font-bold">Baholash uchun suring</span>
                   </div>

                   <div className="flex flex-col items-center opacity-80 animate-pulse">
                       <span className="font-bold text-green-400 bg-black/40 px-2 py-1 rounded mb-2 text-[10px]">Oson</span>
                       <i className="fa-solid fa-arrow-right text-3xl text-green-400"></i>
                   </div>
               </div>
           </div>
       )}

       <div className="relative w-full aspect-[3/4] flex items-center justify-center mt-4">
           {nextWord && (
               <div className="absolute top-4 w-[95%] h-full glass-card rounded-3xl opacity-30 transform scale-95 translate-y-6 border border-white/5 z-0 blur-[2px]">
                  <div className="w-full h-full flex items-center justify-center p-8">
                       <h2 className="text-3xl font-bold text-gray-500">{nextWord.word}</h2>
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
                 transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
             }}
           >
              <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${flipped ? 'rotate-y-180' : ''}`}>
                
                <div 
                    className="absolute w-full h-full backface-hidden glass-card rounded-3xl flex flex-col items-center justify-center p-8 border-4 shadow-2xl bg-slate-800/80"
                    style={{ borderColor: isDragging ? borderColor : 'rgba(59, 130, 246, 0.2)' }}
                >
                    {dragX > 50 && (
                        <div className="absolute top-8 right-8 bg-green-500 text-white px-4 py-1 rounded-full font-black text-xs shadow-lg transform rotate-12 z-20">OSON</div>
                    )}
                    {dragX < -50 && (
                        <div className="absolute top-8 left-8 bg-red-500 text-white px-4 py-1 rounded-full font-black text-xs shadow-lg transform -rotate-12 z-20">QIYIN</div>
                    )}

                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-4 py-1 rounded-full mb-8 font-black tracking-widest uppercase">Yangi So'z</span>
                    <h2 className="text-5xl font-black mb-6 text-center tracking-tighter text-white drop-shadow-xl">{currentWord.word}</h2>
                    <button 
                        onTouchEnd={(e) => { e.stopPropagation(); playTextToSpeech(currentWord.word); }}
                        onClick={(e) => { e.stopPropagation(); playTextToSpeech(currentWord.word); }}
                        className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition active:scale-95 border border-white/5"
                    >
                        <i className="fa-solid fa-volume-high text-2xl text-blue-400"></i>
                    </button>
                    <p className="mt-12 text-gray-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Ma'nosini bilish uchun bosing</p>
                </div>

                <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-card rounded-3xl flex flex-col p-8 bg-slate-900 border-2 border-blue-500/30 overflow-hidden shadow-2xl">
                    <div className="flex flex-col items-center mb-6">
                        <span className="text-[10px] font-black text-blue-400 mb-1 tracking-widest uppercase">O'zbekcha</span>
                        <h2 className="text-3xl font-black text-yellow-400 text-center">{currentWord.translation}</h2>
                        <span className="text-gray-500 text-[10px] mt-1 italic">({currentWord.word})</span>
                    </div>

                    <div className="flex-1 flex flex-col space-y-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <h3 className="text-[10px] font-black text-purple-300 mb-2 tracking-widest uppercase">Ta'rif (Definition)</h3>
                            <p className="text-sm leading-relaxed text-gray-200">{currentWord.definition}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <h3 className="text-[10px] font-black text-blue-300 mb-2 tracking-widest uppercase pl-1">Misol (Example)</h3>
                            <p className="text-sm italic text-gray-300 pl-1 leading-relaxed">"{currentWord.example}"</p>
                        </div>
                    </div>
                    
                    <button 
                        onTouchEnd={(e) => { e.stopPropagation(); setFlipped(false); }}
                        onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
                        className="mt-4 py-2 text-[10px] font-black text-gray-500 hover:text-white transition uppercase tracking-widest border-t border-white/5"
                    >
                        Yopish
                    </button>
                </div>

              </div>
           </div>
       </div>

       <div className="absolute bottom-24 flex items-center justify-center space-x-12 z-20">
           <button 
             onClick={() => handleSwipe('left')}
             className="w-16 h-16 rounded-full bg-slate-800/90 border-b-4 border-red-600 text-red-500 shadow-2xl flex items-center justify-center text-2xl active:translate-y-1 active:border-b-0 transition-all duration-150"
           >
             <i className="fa-solid fa-xmark"></i>
           </button>
           
           <button 
             onClick={() => handleSwipe('right')}
             className="w-16 h-16 rounded-full bg-slate-800/90 border-b-4 border-green-600 text-green-400 shadow-2xl flex items-center justify-center text-2xl active:translate-y-1 active:border-b-0 transition-all duration-150"
           >
             <i className="fa-solid fa-check"></i>
           </button>
       </div>
    </div>
  );
};

export default Lesson;
