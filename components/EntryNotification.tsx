
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
    <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss}></div>

      <div 
        className={`w-full max-w-md h-[85vh] rounded-t-[40px] overflow-hidden relative shadow-2xl transition-all duration-500 bg-[#007aff] flex flex-col ${isAnimatingOut ? 'translate-y-full' : 'translate-y-0 animate-slide-up'}`}
      >
        {/* Top Handle */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/30 rounded-full z-20"></div>

        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-6 right-6 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#007aff] z-20 shadow-lg active:scale-90 transition-transform"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative z-10">
          
          {/* Image Placeholder / Image */}
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6">
            {notification.image ? (
              <img 
                src={notification.image} 
                alt={notification.title} 
                className="max-w-full max-h-[40vh] object-contain rounded-2xl shadow-xl"
                referrerPolicy="no-referrer"
              />
            ) : null}

            <div className="space-y-3">
              <h1 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter">
                {notification.title}
              </h1>
              <p className="text-white/80 text-sm font-bold leading-relaxed">
                {notification.description}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full pt-10 pb-6">
            <button 
              onClick={handleAction}
              className="w-full py-5 rounded-[28px] bg-[#cce5ff] text-[#007aff] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
            >
              {notification.buttonText || 'DAVOM ETISH'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryNotification;
