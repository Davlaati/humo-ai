import React from 'react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showNav?: boolean;
}

const NAV_ITEMS = [
  { id: 'home', icon: 'fa-house', label: 'Asosiy' },
  { id: 'wordbox', icon: 'fa-box-archive', label: 'Word Box' },
  { id: 'speaking-club', icon: 'fa-headset', label: 'Speaking' },
  { id: 'game', icon: 'fa-gamepad', label: "O'yinlar" },
  { id: 'profile', icon: 'fa-user', label: 'Profil' },
];

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, showNav = true }) => {
  return (
    <div className="flex flex-col h-full w-full text-white relative overflow-hidden font-sans">
      {/* Background Decor - Deep Blue/Purple Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-screen"></div>
      
      {/* Dynamic Safe Area Top */}
      <div className="h-[calc(var(--tg-safe-area-inset-top)+10px)] w-full flex-shrink-0 z-[60]"></div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden z-10 scroll-smooth relative no-scrollbar">
        {children}
      </div>

      {showNav && (
        <div className="z-50 pb-[calc(var(--tg-safe-area-inset-bottom)+16px)] pt-4 px-4 fixed bottom-0 w-full pointer-events-none">
          <div className="max-w-sm mx-auto bg-[#0a0f24]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex justify-between items-center p-2 relative pointer-events-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="relative flex flex-col items-center justify-center w-14 h-14 z-10 outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeBubble"
                      className="absolute inset-0 bg-blue-500/20 border border-blue-500/30 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                  )}
                  
                  <motion.div
                    animate={{ 
                      y: isActive ? -8 : 0,
                      scale: isActive ? 1.1 : 1,
                      color: isActive ? '#60A5FA' : '#94A3B8'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <i className={`fa-solid ${item.icon} text-xl ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`}></i>
                  </motion.div>

                  <motion.span
                    initial={false}
                    animate={{ 
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : 10,
                      scale: isActive ? 1 : 0.5
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute bottom-2 text-[8px] font-black uppercase tracking-widest text-blue-300 z-10 pointer-events-none"
                  >
                    {item.label}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;