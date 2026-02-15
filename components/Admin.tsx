
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, AdminPayment, SystemLog, AdminStats, EnglishLevel, SubscriptionRequest, LeaderboardPeriod } from '../types';
import { getSubscriptions, getTopUsers, resetWeeklyLeaderboard, reviewSubscriptionRequest, setAppSetting } from '../services/storageService';
import GrowthDashboard from './GrowthDashboard';

// --- SUB-COMPONENTS ---

const StatCard: React.FC<{ label: string; value: string | number; trend?: string; icon: string; color: string }> = ({ label, value, trend, icon, color }) => (
  <div className="glass-card p-5 rounded-3xl border border-white/5 bg-slate-900/40 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-20 h-20 ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center`}>
        <i className={`fa-solid ${icon} ${color.replace('bg-', 'text-')}`}></i>
      </div>
      {trend && <span className={`text-[10px] font-black ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{trend}</span>}
    </div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <h3 className="text-2xl font-black text-white">{value}</h3>
  </div>
);

const SectionHeader: React.FC<{ title: string; subtitle: string; icon: string }> = ({ title, subtitle, icon }) => (
  <div className="flex items-center space-x-4 mb-8">
    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
      <i className={`fa-solid ${icon} text-indigo-400 text-xl`}></i>
    </div>
    <div>
      <h2 className="text-xl font-black uppercase tracking-tighter italic">{title}</h2>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{subtitle}</p>
    </div>
  </div>
);

// --- MAIN ADMIN PANEL ---

const Admin: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'dashboard' | 'users' | 'payments' | 'ai' | 'settings' | 'logs'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptions, setSubscriptions] = useState<SubscriptionRequest[]>(getSubscriptions());
  const [topUsers, setTopUsers] = useState<UserProfile[]>(getTopUsers('alltime', 100));
  const [logoPreview, setLogoPreview] = useState('');
  
  // Mock Data for Production Feel
  const stats: AdminStats = {
    totalUsers: 12450,
    active24h: 3120,
    newToday: 425,
    totalPayments: 1890,
    aiRequests: 45600
  };

  const [users, setUsers] = useState<UserProfile[]>([
    { id: '1', name: 'Anvar Aliyev', username: 'anvar_dev', level: EnglishLevel.Intermediate, coins: 500, telegramStars: 20, xp: 1200, status: 'active', isPremium: true, joinedAt: '2023-10-01', age: '25', goal: 'IELTS', personalities: ['Kind'], studyMinutes: 30, practiceFrequency: 'Daily', interests: ['IT'], streak: 5, lastActiveDate: '', starsHistory: [] },
    { id: '2', name: 'Dilnoza Karimova', username: 'dilnoza_eng', level: EnglishLevel.Advanced, coins: 1200, telegramStars: 150, xp: 4500, status: 'active', isPremium: true, joinedAt: '2023-09-15', age: '22', goal: 'Business', personalities: ['Strict'], studyMinutes: 45, practiceFrequency: 'Daily', interests: ['Music'], streak: 12, lastActiveDate: '', starsHistory: [] },
    { id: '3', name: 'Jasur Bek', username: 'jasur_99', level: EnglishLevel.Beginner, coins: 50, telegramStars: 0, xp: 150, status: 'blocked', isPremium: false, joinedAt: '2023-12-20', age: '19', goal: 'Travel', personalities: ['Playful'], studyMinutes: 20, practiceFrequency: 'Flexible', interests: ['Gaming'], streak: 1, lastActiveDate: '', starsHistory: [] },
  ]);

  const payments: AdminPayment[] = [
    { id: 'p1', userId: '1', username: 'anvar_dev', amount: 200, currency: 'XTR', status: 'paid', txId: 'TX_982341', createdAt: '2023-12-25 14:20' },
    { id: 'p2', userId: '2', username: 'dilnoza_eng', amount: 500, currency: 'XTR', status: 'pending', txId: 'TX_982345', createdAt: '2023-12-25 15:10' },
    { id: 'p3', userId: '4', username: 'unknown_user', amount: 100, currency: 'XTR', status: 'failed', txId: 'TX_982349', createdAt: '2023-12-24 09:45' },
  ];

  const logs: SystemLog[] = [
    { id: 'l1', type: 'info', message: 'User @anvar_dev upgraded to Premium', timestamp: '2023-12-25 14:22' },
    { id: 'l2', type: 'error', message: 'Gemini API Timeout on /chat endpoint', timestamp: '2023-12-25 13:05' },
    { id: 'l3', type: 'action', message: 'Admin modified system prompt', adminName: 'SuperAdmin', timestamp: '2023-12-25 10:00' },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [users, searchQuery]);

  // --- MODULE RENDERS ---

  const renderDashboard = () => (
    <GrowthDashboard />
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4 bg-slate-900/50 p-2 rounded-2xl border border-white/5">
        <i className="fa-solid fa-magnifying-glass ml-4 text-slate-600"></i>
        <input 
          type="text" 
          placeholder="Search by name or username..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent flex-1 py-3 text-sm focus:outline-none"
        />
      </div>

      <div className="glass-card rounded-[35px] overflow-hidden border border-white/5">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="p-5">User</th>
              <th className="p-5">Status</th>
              <th className="p-5">Balance</th>
              <th className="p-5">Joined</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-400">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-white">{user.name}</p>
                      <p className="text-[10px] text-slate-500">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-5">
                  <p className="font-bold text-white">{user.telegramStars} Stars</p>
                  <p className="text-[10px] text-slate-500">{user.coins} HC</p>
                </td>
                <td className="p-5 text-slate-500">{user.joinedAt}</td>
                <td className="p-5 text-right">
                  <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition flex items-center justify-center">
                    <i className="fa-solid fa-ellipsis-vertical text-slate-500"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6 rounded-[35px] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Pending Premium Requests</h3>
          <span className="text-[10px] text-amber-400 font-black">{subscriptions.filter(s => s.status === 'pending').length} pending</span>
        </div>
        <div className="space-y-4">
          {subscriptions.length === 0 && <p className="text-xs text-slate-500">No requests yet.</p>}
          {subscriptions.map((sub) => (
            <div key={sub.id} className="p-4 rounded-2xl border border-white/10 bg-slate-900/40">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-white">@{sub.username || sub.userId} · {sub.planType}</p>
                  <p className="text-[10px] text-slate-500">{sub.price.toLocaleString()} UZS · {new Date(sub.createdAt).toLocaleString('uz-UZ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { reviewSubscriptionRequest(sub.id, 'approved'); setSubscriptions(getSubscriptions()); }} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-black text-[9px] uppercase">Approve</button>
                  <button onClick={() => { reviewSubscriptionRequest(sub.id, 'rejected'); setSubscriptions(getSubscriptions()); }} className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 font-black text-[9px] uppercase">Reject</button>
                </div>
              </div>
              {sub.proofImage && <img src={sub.proofImage} alt="proof" className="mt-3 w-full h-40 object-cover rounded-xl border border-white/10" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <div className="glass-card p-8 rounded-[40px] border border-white/5 space-y-6">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Leaderboard Controls</h3>
        <button onClick={() => { resetWeeklyLeaderboard(); setTopUsers(getTopUsers('alltime', 100)); }} className="w-full py-4 bg-indigo-600 rounded-[20px] font-black text-white text-xs uppercase tracking-widest">Reset Weekly Leaderboard</button>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {topUsers.map((u, i) => (
            <div key={u.id} className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
              <p className="text-xs font-black text-white">#{i + 1} {u.name}</p>
              <p className="text-[10px] text-blue-400 font-black">{u.pointsTotal || 0} pts</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-8 rounded-[40px] border border-white/5 flex flex-col">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Loading Logo Config</h3>
        <label className="p-6 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-500/5 text-center cursor-pointer">
          <span className="text-[10px] uppercase tracking-widest font-black text-indigo-400">Upload splash logo</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setLogoPreview(String(reader.result || ''));
            reader.readAsDataURL(file);
          }} />
        </label>
        {logoPreview && <img src={logoPreview} alt="logo preview" className="mt-4 h-40 object-contain rounded-2xl border border-white/10" />}
        <button onClick={() => { if (logoPreview) setAppSetting('loading_logo', logoPreview); }} className="mt-6 w-full py-4 bg-indigo-600 rounded-[20px] font-black text-white text-xs uppercase tracking-widest">Save Loading Logo</button>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 z-20">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <i className="fa-solid fa-shield-halved text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-black tracking-tighter italic">HUMO <span className="text-indigo-500">CORE</span></h1>
          </div>

          <nav className="space-y-2">
            <NavItem icon="fa-chart-pie" label="Dashboard" active={activeModule === 'dashboard'} onClick={() => setActiveModule('dashboard')} />
            <NavItem icon="fa-users-gear" label="Users" active={activeModule === 'users'} onClick={() => setActiveModule('users')} />
            <NavItem icon="fa-credit-card" label="Payments" active={activeModule === 'payments'} onClick={() => setActiveModule('payments')} />
            <NavItem icon="fa-brain" label="AI Monitoring" active={activeModule === 'ai'} onClick={() => setActiveModule('ai')} />
            <NavItem icon="fa-sliders" label="Settings" active={activeModule === 'settings'} onClick={() => setActiveModule('settings')} />
            <NavItem icon="fa-list-ul" label="System Logs" active={activeModule === 'logs'} onClick={() => setActiveModule('logs')} />
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
           <div className="flex items-center space-x-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-white/10"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Admin v4.0</span>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-950 p-6 md:p-10 relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-indigo-600 rounded-full blur-[150px] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-emerald-600 rounded-full blur-[150px] opacity-[0.03] pointer-events-none"></div>

        {/* Top Header */}
        <div className="flex justify-between items-center mb-10">
           <div className="hidden md:block">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1">System Administration</h4>
              <p className="text-xs text-slate-400 font-bold uppercase">Welcome back, Super Admin</p>
           </div>
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center relative">
                 <i className="fa-solid fa-bell text-slate-400 text-sm"></i>
                 <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950"></div>
              </div>
              <button className="px-4 py-2 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase rounded-xl border border-rose-500/20 active:scale-95 transition">Logout</button>
           </div>
        </div>

        {/* Dynamic Module Rendering */}
        {activeModule === 'dashboard' && (
          <>
            <SectionHeader title="System Analytics" subtitle="Real-time performance overview" icon="fa-chart-pie" />
            {renderDashboard()}
          </>
        )}
        {activeModule === 'users' && (
          <>
            <SectionHeader title="User Management" subtitle="Manage members and permissions" icon="fa-users-gear" />
            {renderUsers()}
          </>
        )}
        {activeModule === 'payments' && (
          <>
            <SectionHeader title="Revenue Tracking" subtitle="Transactions and financial history" icon="fa-credit-card" />
            {renderPayments()}
          </>
        )}
        {activeModule === 'settings' && (
          <>
            <SectionHeader title="Platform Controls" subtitle="System variables and toggles" icon="fa-sliders" />
            {renderSettings()}
          </>
        )}
        {activeModule === 'logs' && (
          <>
            <SectionHeader title="System Logs" subtitle="Internal audit and error reporting" icon="fa-list-ul" />
            <div className="glass-card p-6 rounded-[35px] border border-white/5 space-y-4">
               {logs.map(log => (
                 <div key={log.id} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-lg font-black uppercase text-[8px] ${log.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{log.type}</span>
                      <p className="text-slate-300">{log.message}</p>
                    </div>
                    <span className="text-slate-600 font-mono">{log.timestamp}</span>
                 </div>
               ))}
               <button className="w-full py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition">Load older logs</button>
            </div>
          </>
        )}
        {activeModule === 'ai' && (
          <>
            <SectionHeader title="AI Monitoring" subtitle="Token usage and behavior detection" icon="fa-brain" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <StatCard label="Total Tokens" value="4.2M" trend="+15%" icon="fa-microchip" color="bg-emerald-500" />
               <StatCard label="Avg Response" value="1.2s" trend="-200ms" icon="fa-gauge-high" color="bg-blue-500" />
               <StatCard label="Active Sessions" value="124" trend="+8" icon="fa-comments" color="bg-amber-500" />
            </div>
            <div className="mt-10 glass-card p-6 rounded-[35px] border border-white/5">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Usage by User</h3>
                <div className="space-y-4">
                  {users.slice(0, 3).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                      <span className="font-bold">@{u.username}</span>
                      <div className="flex items-center space-x-10">
                        <span className="text-[10px] text-slate-500 uppercase font-black">2.4k Tokens</span>
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </>
        )}

        <div className="h-24"></div>
      </div>
    </div>
  );
};

// --- HELPER UI COMPONENTS ---

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 active:scale-95 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
  >
    <i className={`fa-solid ${icon} text-sm`}></i>
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const ToggleItem: React.FC<{ label: string; description: string; active: boolean }> = ({ label, description, active }) => (
  <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
    <div>
      <p className="text-xs font-black text-white uppercase tracking-tighter">{label}</p>
      <p className="text-[9px] text-slate-500 font-bold leading-tight">{description}</p>
    </div>
    <div className={`w-10 h-5 rounded-full relative transition-colors duration-500 cursor-pointer ${active ? 'bg-indigo-500' : 'bg-slate-800'}`}>
      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-500 ${active ? 'left-6' : 'left-1'}`}></div>
    </div>
  </div>
);

export default Admin;
