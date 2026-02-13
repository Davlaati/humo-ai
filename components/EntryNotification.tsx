
import React, { useState } from 'react';
import { EntryNotification as EntryNotifType } from '../types';

interface EntryNotificationProps {
  notification: EntryNotifType;
  onClose: () => void;
}

const EntryNotification: React.FC<EntryNotificationProps> = ({ notification, onClose }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(onClose, 500); 
  };

  return (
    <div className="absolute inset-0 z-[4001] flex items-end justify-center p-4">
      <div 
        className={`w-full max-w-sm rounded-[45px] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 bg-[#0c1222] border border-white/10 ${isAnimatingOut ? 'translate-y-[120%] opacity-0' : 'translate-y-0 animate-slide-up'}`}
      >
        {/* Glow behind content */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-600 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

        <div className="p-10 flex flex-col items-center text-center relative z-10">
          
          {/* Creative Icon/Visual */}
          <div className="mb-8 relative">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg rotate-12 animate-float">
                  <i className="fa-solid fa-face-smile-beam text-4xl text-white"></i>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  <i className="fa-solid fa-sparkles text-[10px] text-yellow-900"></i>
              </div>
          </div>

          <div className="space-y-4 mb-10">
            <h1 className="text-3xl font-black text-white leading-tight">
              {notification.title}
            </h1>
            <p className="text-sm text-gray-400 px-2 leading-relaxed font-medium">
              {notification.description}
            </p>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleDismiss}
            className="w-full py-5 rounded-[25px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all mb-4"
          >
            {notification.buttonText}
          </button>

          {/* Dismiss button */}
          <button 
            onClick={handleDismiss}
            className="text-gray-600 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-gray-400 transition py-2"
          >
            Keyinroq
          </button>
        </div>

        {/* Top Decor Line */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/5 rounded-full"></div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-10px) rotate(8deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default EntryNotification;
