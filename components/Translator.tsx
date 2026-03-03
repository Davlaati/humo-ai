
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { playTapSound } from '../services/audioService';

interface TranslatorProps {
  onNavigate?: (tab: string) => void;
}

const Translator: React.FC<TranslatorProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Uzbek');

  const handleBack = () => {
    playTapSound();
    if (onNavigate) onNavigate('home');
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    playTapSound();
    setIsLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text from ${sourceLang} to ${targetLang}: "${inputText}"`,
        config: {
          systemInstruction: "You are a professional translator. Provide only the translated text without any explanations or extra characters.",
        }
      });
      
      setTranslatedText(response.text || 'Tarjima qilishda xatolik yuz berdi.');
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    playTapSound();
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const copyToClipboard = (text: string) => {
    playTapSound();
    navigator.clipboard.writeText(text);
    alert("Nusxa olindi!");
  };

  return (
    <div className="p-5 pb-32 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
         <div className="flex flex-col">
            <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">AI Powered</span>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Tarjimon</h1>
         </div>
         <button 
           onClick={handleBack}
           className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all"
         >
           <i className="fa-solid fa-arrow-left text-slate-400"></i>
         </button>
      </div>

      {/* Language Selector */}
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-lg">
        <div className="flex-1 text-center">
          <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Dan</span>
          <span className="text-sm font-black text-white">{sourceLang}</span>
        </div>
        
        <button 
          onClick={swapLanguages}
          className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 active:rotate-180 transition-transform duration-500"
        >
          <i className="fa-solid fa-right-left text-blue-400 text-xs"></i>
        </button>

        <div className="flex-1 text-center">
          <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Ga</span>
          <span className="text-sm font-black text-white">{targetLang}</span>
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <div className="relative">
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Matnni kiriting..."
            className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-[30px] p-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all min-h-[150px] text-lg font-medium"
          />
          {inputText && (
            <button 
              onClick={() => setInputText('')}
              className="absolute top-4 right-4 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <button 
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim()}
          className={`w-full py-5 rounded-[25px] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center space-x-3 ${
            isLoading || !inputText.trim() 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-white text-slate-950 active:scale-95'
          }`}
        >
          {isLoading ? (
            <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
          ) : (
            <>
              <span>Tarjima qilish</span>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </>
          )}
        </button>
      </div>

      {/* Output Area */}
      {translatedText && (
        <div className="animate-slide-up">
          <div className="bg-blue-500/5 backdrop-blur-xl border border-blue-500/20 rounded-[30px] p-6 relative group">
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={() => copyToClipboard(translatedText)}
                className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-copy text-xs"></i>
              </button>
            </div>
            
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-3">Natija</span>
            <p className="text-white text-lg font-medium leading-relaxed">
              {translatedText}
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-6 bg-white/5 rounded-[30px] border border-white/5">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <i className="fa-solid fa-lightbulb text-yellow-400"></i>
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Maslahat</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI tarjimonimiz kontekstni yaxshi tushunadi. To'liq gaplarni tarjima qilish orqali eng yaxshi natijaga erishing!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translator;
