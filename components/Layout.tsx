import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showNav?: boolean;
}

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
        <div className="z-50 pb-[calc(var(--tg-safe-area-inset-bottom)+12px)] pt-3 px-4 glass-panel rounded-t-[30px] fixed bottom-0 w-full border-t border-white/10 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center max-w-sm mx-auto">
            <NavButton icon="fa-house" label="Asosiy" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
            <NavButton icon="fa-headset" label="Speaking" active={activeTab === 'speaking-club'} onClick={() => onTabChange('speaking-club')} />
            
            <div className="relative -top-10">
               <button 
                onClick={() => onTabChange('game')}
                className="w-16 h-16 rounded-full liquid-button text-white flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.6)] transform transition active:scale-90 border-[4px] border-[#1e1b4b] group"
               >
                  <i className="fa-solid fa-gamepad text-2xl group-hover:rotate-12 transition-transform drop-shadow-md"></i>
               </button>
            </div>
            
            <NavButton icon="fa-book-journal-whills" label="Lug'at" active={activeTab === 'dictionary'} onClick={() => onTabChange('dictionary')} />
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
    className={`flex flex-col items-center justify-center w-14 transition-all duration-300 active:scale-90 ${active ? 'text-blue-400' : 'text-slate-400'}`}
  >
    <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${active ? 'bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}`}>
        <i className={`fa-solid ${icon} ${active ? 'text-xl drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'text-lg'}`}></i>
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 transition-all ${active ? 'opacity-100 text-blue-300' : 'opacity-50'}`}>{label}</span>
  </button>
);

export default Layout;