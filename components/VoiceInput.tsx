import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceInputProps {
  onTextRecognized: (text: string) => void;
  language?: 'en-US' | 'uz-UZ' | 'ru-RU';
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTextRecognized, language = 'en-US' }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTextRecognized(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, onTextRecognized]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Kechirasiz, qurilmangiz ovozli kiritishni qo'llab-quvvatlamaydi.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      
      // Haptic feedback
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    }
  };

  return (
    <button
      onClick={toggleListening}
      className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all shadow-lg active:scale-95 ${
        isListening ? 'bg-red-500' : 'bg-blue-600'
      }`}
    >
      {isListening ? (
        <>
          <Square className="w-5 h-5 text-white fill-white" />
          {/* Pulse animation when listening */}
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-red-500"
          />
        </>
      ) : (
        <Mic className="w-6 h-6 text-white" />
      )}
    </button>
  );
};
