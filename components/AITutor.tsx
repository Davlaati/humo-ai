
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
      text: `Salom, ${user.name}! 🌟 Men sizning Ravona AI mentoringizman. Bugun ingliz tilini qanday qiziqarli usulda o'rganamiz? Grammatika sirlari, yangi so'zlar yoki shunchaki do'stona suhbat? Men tayyorman! 🚀`,
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

      // System instruction for a more engaging and localized experience
      const systemInstruction = `
        Siz RAVONA AI - shaxsiy ingliz tili mentorisiz. 
        Foydalanuvchi: ${user.name}, Darajasi: ${user.level}, Qiziqishlari: ${user.interests.join(', ')}.
        
        Vazifangiz:
        1. Foydalanuvchi bilan ingliz tilida suhbatlashing (80% inglizcha, 20% o'zbekcha).
        2. Har bir javobingizda foydalanuvchini ruhlantiring va emoji ishlating.
        3. Agar foydalanuvchi xato qilsa, uni "Correction: ..." deb alohida qatorda muloyimlik bilan tuzating.
        4. Har doim qisqa, lo'nda va qiziqarli javob bering (< 40 so'z).
        5. Foydalanuvchiga har doim bitta savol bering, suhbat davom etishi uchun.
        6. O'zbekcha so'zlarni inglizchaga tarjima qilib, talaffuzini ham yozing (masalan: "Apple [æpl] - Olma").
      `;

      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            ...history.map(h => ({ role: h.role, parts: h.parts })),
            { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          systemInstruction: systemInstruction
        }
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "Uzr, tushunmadim. Qayta yozib ko'ring. 😊",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMessage]);
      
      const updatedUser = awardXP(user, 5);
      onUpdateUser(updatedUser);

    } catch (error) {
      console.error("Tutor Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Kechirasiz, hozircha ulanishda biroz muammo bor. 😅 Iltimos, keyinroq urinib ko'ring!",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c1222] animate-fade-in">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-30 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/10">
              <i className="fa-solid fa-robot text-white text-2xl animate-pulse"></i>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#0c1222] rounded-full shadow-lg"></div>
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Ravona AI Mentor</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Faol • Yordamga tayyor</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('speaking-club')}
          className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 active:scale-90 transition-all hover:bg-blue-500/20 shadow-lg"
        >
          <i className="fa-solid fa-microphone-lines text-blue-400 text-lg"></i>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] relative ${m.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div className={`px-6 py-4 rounded-[30px] text-sm font-bold leading-relaxed shadow-2xl ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none border border-blue-400/30' 
                    : 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-white/10 backdrop-blur-md'
                }`}>
                  {m.text}
                </div>
                <div className={`flex items-center mt-2 space-x-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    {m.timestamp.getHours()}:{String(m.timestamp.getMinutes()).padStart(2, '0')}
                  </span>
                  {m.role === 'model' && (
                    <button 
                      onClick={() => { playTapSound(); playTextToSpeech(m.text); }}
                      className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-all border border-blue-500/20"
                    >
                      <i className="fa-solid fa-volume-high text-[10px] text-blue-400"></i>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 px-6 py-4 rounded-[30px] rounded-tl-none border border-white/10 flex space-x-1.5 shadow-xl">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 pt-2 pb-32 bg-gradient-to-t from-[#0c1222] via-[#0c1222] to-transparent">
        <div className="glass-panel p-2 rounded-[35px] flex items-center bg-slate-900/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] focus-within:border-blue-500/50 transition-all focus-within:shadow-blue-500/10">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Inglizcha yoki o'zbekcha yozing..." 
            className="bg-transparent flex-1 px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none font-bold"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className={`w-14 h-14 rounded-[25px] flex items-center justify-center transition-all shadow-xl ${
              input.trim() && !isTyping 
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-500/30 active:scale-90' 
                : 'bg-slate-800 text-slate-600 grayscale'
            }`}
          >
            <i className="fa-solid fa-paper-plane text-xl"></i>
          </button>
        </div>
        <div className="mt-4 flex justify-center space-x-2 overflow-x-auto no-scrollbar py-1">
           <QuickAction text="Grammatika 📚" onClick={() => setInput("Menga bugun qaysi grammatikani o'rgatasiz?")} />
           <QuickAction text="Lug'at 📖" onClick={() => setInput("Yangi 5 ta qiziqarli so'z o'rgating")} />
           <QuickAction text="Suhbat 💬" onClick={() => setInput("Keling, sayohat haqida gaplashamiz")} />
        </div>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button 
    onClick={() => { playTapSound(); onClick(); }}
    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all whitespace-nowrap"
  >
    {text}
  </button>
);

export default AITutor;
