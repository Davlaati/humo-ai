import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Award, ChevronRight } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const questions: Question[] = [
  { id: 1, question: "By the time the teacher arrived, the students _____ the grammar exercise.", options: ["already finished", "had already finished", "have already finished", "already finish"], correctAnswer: 1 },
  { id: 2, question: "_____ she studied hard, she didn't pass the exam.", options: ["Despite", "Although", "In spite of", "However"], correctAnswer: 1 },
  { id: 3, question: "If I _____ you, I would have accepted the job offer.", options: ["was", "were", "had been", "would be"], correctAnswer: 2 },
  { id: 4, question: "He is very good _____ solving complex linguistic problems.", options: ["at", "in", "on", "with"], correctAnswer: 0 },
  { id: 5, question: "The man _____ I spoke to yesterday is the CEO.", options: ["who", "which", "whom", "whose"], correctAnswer: 2 },
  { id: 6, question: "The report _____ by the committee by tomorrow morning.", options: ["will be completed", "will have been completed", "is completed", "has been completed"], correctAnswer: 1 },
  { id: 7, question: "You _____ have told me about the meeting; I was waiting for hours!", options: ["must", "should", "could", "might"], correctAnswer: 1 },
  { id: 8, question: "She stopped _____ to her friend because she was late.", options: ["to talk", "talking", "talk", "talked"], correctAnswer: 1 },
  { id: 9, question: "_____ had I left the house than it started to rain.", options: ["No sooner", "Hardly", "Scarcely", "Not only"], correctAnswer: 0 },
  { id: 10, question: "I need to _____ my car _____ tomorrow.", options: ["have / repaired", "get / repair", "have / repair", "get / to repair"], correctAnswer: 0 }
];

const RavonaMock: React.FC<{ user: UserProfile; onUpdateUser: (user: UserProfile) => void; onNavigate: (tab: string) => void }> = ({ user, onUpdateUser, onNavigate }) => {
  const [state, setState] = useState<'intro' | 'exam' | 'result'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  useEffect(() => {
    if (state === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && state === 'exam') {
      finishExam();
    }
  }, [state, timeLeft]);

  const handleNext = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);

    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1);
    }
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    const finalScore = Math.round(1 + (score / questions.length) * 11);
    const ravonaScore = Math.max(1, Math.min(12, finalScore));
    onUpdateUser({ ...user, ravonaScore });
    setState('result');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 pb-32 flex flex-col font-sans overflow-y-auto no-scrollbar">
      <AnimatePresence mode="wait">
        {state === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-32 h-32 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-600/20">
                <Trophy size={64} className="text-white" />
            </div>
            <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter italic">Ravona Mock</h1>
            <p className="text-slate-400 mb-8 max-w-xs font-bold">Grammatika darajangizni aniqlang va sertifikatga ega bo'ling!</p>
            <button onClick={() => setState('exam')} className="bg-blue-600 hover:bg-blue-700 px-10 py-5 rounded-2xl font-black text-lg w-full max-w-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Boshlash</button>
          </motion.div>
        )}

        {state === 'exam' && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-blue-400 font-mono text-xl bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20"><Clock size={20} /> {formatTime(timeLeft)}</div>
              <div className="text-sm text-slate-500 font-black uppercase tracking-widest">{currentQuestion + 1} / {questions.length}</div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card bg-slate-900/50 p-8 rounded-3xl border border-white/5 mb-8 shadow-xl">
                <p className="text-xl font-bold leading-relaxed">{questions[currentQuestion].question}</p>
              </motion.div>
              
              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <button 
                    key={index} 
                    onClick={() => setSelectedAnswer(index)} 
                    className={`w-full p-5 rounded-2xl text-left border-2 transition-all font-bold ${selectedAnswer === index ? 'border-blue-500 bg-blue-500/20' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleNext} 
              disabled={selectedAnswer === null}
              className={`mt-8 w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all ${selectedAnswer === null ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95'}`}
            >
              Keyingisi <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {state === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl mb-8 shadow-2xl shadow-blue-600/30 w-full max-w-xs">
              <Award size={80} className="text-white mx-auto mb-4" />
              <div className="text-7xl font-black text-white">{user.ravonaScore}</div>
              <div className="text-blue-200 font-bold uppercase tracking-widest">Ravona Score</div>
            </motion.div>
            
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Tabriklaymiz!</h2>
            <p className="text-slate-400 mb-8 font-bold">Sizning IELTS darajangiz: <span className="text-white font-bold">{user.ravonaScore! >= 11 ? '8.5 - 9.0' : user.ravonaScore! >= 9 ? '7.0 - 8.0' : user.ravonaScore! >= 7 ? '5.5 - 6.5' : user.ravonaScore! >= 5 ? '4.0 - 5.0' : 'Below 4.0'}</span></p>
            
            <div className="w-full space-y-4 mb-10 text-left">
              <h3 className="text-lg font-black uppercase tracking-widest text-blue-400 mb-4">Xatolar ustida ishlash:</h3>
              {questions.map((q, i) => {
                const isCorrect = userAnswers[i] === q.correctAnswer;
                return (
                  <div key={i} className={`p-4 rounded-2xl border ${isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className="text-sm font-bold mb-2">{i + 1}. {q.question}</p>
                    <div className="flex flex-col gap-1">
                      <p className={`text-xs ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        Sizning javobingiz: {q.options[userAnswers[i]]}
                      </p>
                      {!isCorrect && (
                        <p className="text-xs text-green-400">
                          To'g'ri javob: {q.options[q.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => onNavigate('home')} className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-lg w-full max-w-xs shadow-xl active:scale-95 transition-all">Asosiy sahifa</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RavonaMock;
