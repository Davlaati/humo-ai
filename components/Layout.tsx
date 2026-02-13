
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, showNav = true }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-white relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-20 animate-pulse pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-20 pointer-events-none z-0"></div>

      <div className="flex-1 overflow-y-auto z-10 scroll-smooth relative">
        {children}
      </div>

      {showNav && (
        <div className="z-50 pb-6 pt-2 px-4 glass-panel rounded-t-3xl fixed bottom-0 w-full border-t border-white/5 backdrop-blur-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center max-w-sm mx-auto">
            <NavButton icon="fa-house-chimney" label="Asosiy" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
            <NavButton icon="fa-book-bookmark" label="Dars" active={activeTab === 'learn'} onClick={() => onTabChange('learn')} />
            <div className="relative -top-7">
               <button 
                onClick={() => onTabChange('game')}
                className="w-16 h-16 rounded-full liquid-button text-white flex items-center justify-center shadow-[0_5px_15px_rgba(99,102,241,0.5)] transform transition active:scale-90 border-4 border-slate-900 group"
               >
                  <i className="fa-solid fa-gamepad text-2xl group-hover:rotate-12 transition-transform"></i>
               </button>
            </div>
            <NavButton icon="fa-ranking-star" label="Reyting" active={activeTab === 'leaderboard'} onClick={() => onTabChange('leaderboard')} />
            <NavButton icon="fa-user-astronaut" label="Profil" active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-14 transition-all duration-300 active:scale-90 ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-blue-400/10 shadow-inner' : ''}`}>
        <i className={`fa-solid ${icon} text-lg`}></i>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default Layout;
