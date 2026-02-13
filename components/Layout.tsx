
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, showNav = true }) => {
  return (
    <div className="flex flex-col h-full w-full bg-[#0c1222] text-white relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-10 pointer-events-none z-0"></div>
      
      {/* Dynamic Safe Area Top - Telegram uchun maxsus padding */}
      <div className="h-[calc(var(--tg-safe-area-inset-top)+10px)] w-full flex-shrink-0 bg-[#0c1222] z-[60]"></div>

      <div className="flex-1 overflow-y-auto z-10 scroll-smooth relative no-scrollbar">
        {children}
      </div>

      {showNav && (
        <div className="z-50 pb-[calc(var(--tg-safe-area-inset-bottom)+12px)] pt-3 px-4 glass-panel rounded-t-[35px] fixed bottom-0 w-full border-t border-white/5 backdrop-blur-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center max-w-sm mx-auto">
            <NavButton icon="fa-house" label="Asosiy" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
            <NavButton icon="fa-book-open" label="Dars" active={activeTab === 'learn'} onClick={() => onTabChange('learn')} />
            
            <div className="relative -top-10">
               <button 
                onClick={() => onTabChange('game')}
                className="w-16 h-16 rounded-full liquid-button text-white flex items-center justify-center shadow-[0_10px_30px_rgba(59,130,246,0.5)] transform transition active:scale-90 border-[6px] border-[#0c1222] group"
               >
                  <i className="fa-solid fa-gamepad text-2xl group-hover:rotate-12 transition-transform"></i>
               </button>
            </div>
            
            <NavButton icon="fa-trophy" label="Reyting" active={activeTab === 'leaderboard'} onClick={() => onTabChange('leaderboard')} />
            <NavButton icon="fa-user" label="Profil" active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-14 transition-all duration-300 active:scale-90 ${active ? 'text-blue-400' : 'text-slate-500'}`}
  >
    <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${active ? 'bg-blue-400/10' : ''}`}>
        <i className={`fa-solid ${icon} ${active ? 'text-xl' : 'text-lg'}`}></i>
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest mt-1.5 transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

export default Layout;
