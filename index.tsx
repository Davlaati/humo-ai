import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboardPage from './components/AdminDashboardPage';

const ADMIN_TELEGRAM_ID = '6067477588';
const ADMIN_TOKEN_KEY = 'admin_jwt_token';

const RootEntry: React.FC = () => {
  const telegramId = String((window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id || '');
  const hasAdminToken = Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));

  if (telegramId === ADMIN_TELEGRAM_ID || hasAdminToken) {
    return <Navigate to="/admin" replace />;
  }

  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootEntry />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
