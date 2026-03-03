
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { getAIClient, playTextToSpeech } from '../services/geminiService';
import { playTapSound } from '../services/audioService';
import { awardXP } from '../services/gamificationService';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface AITutorProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: UserProfile) => void;
}

const AITutor: React.FC<AITutorProps> = ({ user, onNavigate, onUpdateUser }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: `Salom, ${user.name}! Men sizning shaxsiy ingliz tili mentoringizman. Bugun nima haqida suhbatlashamiz? Sizga grammatika, yangi so'zlar yoki shunchaki muloqotda yordam berishim mumkin.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    playTapSound();

    try {
      const ai = getAIClient();
      if (!ai) throw new Error("AI client not available");

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `
            Siz RAVONA AI - shaxsiy ingliz tili mentorisiz. 
            Foydalanuvchi: ${user.name}, Darajasi: ${user.level}, Qiziqishlari: ${user.interests.join(', ')}.
            Vazifangiz:
            1. Foydalanuvchi bilan ingliz tilida suhbatlashing, lekin tushunarsiz joylarda o'zbekcha izoh bering.
            2. Xatolarni muloyimlik bilan tuzating.
            3. Har doim qisqa va qiziqarli javob bering (< 50 so'z).
            4. Foydalanuvchini ko'proq gapirishga undang.
            5. Agar foydalanuvchi o'zbekcha yozsa, inglizcha javob berib, tarjimasini ham qo'shing.
          `,
        }
      });

      // Send the whole history for context
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            ...history.map(h => ({ role: h.role, parts: h.parts })),
            { role: 'user', parts: [{ text: input }] }
        ]
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "Uzr, tushunmadim. Qayta yozib ko'ring.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMessage]);
      
      // Award XP for each interaction
      const updatedUser = awardXP(user, 5);
      onUpdateUser(updatedUser);

    } catch (error) {
      console.error("Tutor Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Kechirasiz, hozircha ulanishda muammo bor. Iltimos, keyinroq urinib ko'ring.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c1222] animate-fade-in">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-robot text-white text-xl"></i>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0c1222] rounded-full"></div>
          </div>
          <div>
            <h1 className="text-lg font-black italic uppercase tracking-tighter text-white">Ravona Tutor</h1>
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Online • AI Mentor</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('speaking-club')}
          className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 active:scale-90 transition"
        >
          <i className="fa-solid fa-microphone text-blue-400"></i>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] relative ${m.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div className={`px-5 py-3.5 rounded-[25px] text-sm font-medium leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5'
                }`}>
                  {m.text}
                </div>
                <div className={`flex items-center mt-1.5 space-x-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[8px] font-bold text-slate-600 uppercase">
                    {m.timestamp.getHours()}:{String(m.timestamp.getMinutes()).padStart(2, '0')}
                  </span>
                  {m.role === 'model' && (
                    <button 
                      onClick={() => playTextToSpeech(m.text)}
                      className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                    >
                      <i className="fa-solid fa-volume-high text-[8px] text-blue-400"></i>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 px-5 py-3 rounded-[25px] rounded-tl-none border border-white/5 flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 pt-2 pb-32 bg-gradient-to-t from-[#0c1222] via-[#0c1222] to-transparent">
        <div className="glass-panel p-1.5 rounded-[30px] flex items-center bg-slate-900/80 border border-white/10 shadow-2xl focus-within:border-blue-500/50 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Xabar yozing..." 
            className="bg-transparent flex-1 px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              input.trim() && !isTyping 
                ? 'bg-blue-600 text-white shadow-blue-500/20 active:scale-90' 
                : 'bg-slate-800 text-slate-600 grayscale'
            }`}
          >
            <i className="fa-solid fa-paper-plane text-lg"></i>
          </button>
        </div>
        <div className="mt-3 flex justify-center space-x-4">
           <button onClick={() => setInput("Grammatikani tushuntir")} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition">Grammatika</button>
           <button onClick={() => setInput("Yangi so'zlar o'rgat")} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition">Yangi so'zlar</button>
           <button onClick={() => setInput("Muloqot qilaylik")} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition">Muloqot</button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
