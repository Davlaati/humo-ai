
import React, { useState } from 'react';
import { EntryNotification as EntryNotifType } from '../types';

interface EntryNotificationProps {
  notification: EntryNotifType;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

const EntryNotification: React.FC<EntryNotificationProps> = ({ notification, onClose, onNavigate }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(onClose, 500); 
  };

  const handleAction = () => {
    if (!notification.buttonAction || notification.buttonAction.type === 'close') {
      handleDismiss();
      return;
    }

    if (notification.buttonAction.type === 'link') {
      window.open(notification.buttonAction.value, '_blank');
      handleDismiss();
    } else if (notification.buttonAction.type === 'page') {
      if (onNavigate) {
        onNavigate(notification.buttonAction.value);
      }
      handleDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleDismiss}></div>

      <div 
        className={`w-full max-w-sm rounded-[40px] overflow-hidden relative shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col ${isAnimatingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-zoom-in'}`}
      >
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white z-20 hover:bg-white/20 active:scale-90 transition-transform"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
          
          {/* Image */}
          {notification.image && (
            <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center mb-6 shadow-xl overflow-hidden">
              <img 
                src={notification.image} 
                alt={notification.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="space-y-2 mb-8">
            <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">
              {notification.title}
            </h1>
            <p className="text-white/70 text-xs font-bold leading-relaxed">
              {notification.description}
            </p>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleAction}
            className="w-full py-4 rounded-[20px] bg-white text-blue-700 font-black text-xs uppercase tracking-[0.1em] shadow-xl active:scale-95 transition-all"
          >
            {notification.buttonText || 'DAVOM ETISH'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryNotification;
