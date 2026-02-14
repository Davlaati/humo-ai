import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboardPage from './components/AdminDashboardPage';

const ADMIN_TELEGRAM_ID = '6067477588';
const ADMIN_TOKEN_KEY = 'admin_jwt_token';

const RootEntry: React.FC = () => {
  const path = window.location.pathname;
  if (path === '/admin/dashboard') return <AdminDashboardPage />;
  if (path === '/admin' || path === '/admin/') return <AdminLoginPage />;

  const telegramId = String((window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id || '');
  const hasAdminToken = Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));

  if (path === '/' && (telegramId === ADMIN_TELEGRAM_ID || hasAdminToken)) {
    window.location.replace('/admin');
    return null;
  }

  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RootEntry />
  </React.StrictMode>
);
