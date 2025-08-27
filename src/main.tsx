import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TelegramPage from './pages/TelegramPage';
import FacebookPage from './pages/FacebookPage';
import TiktokPage from './pages/TiktokPage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './auth';

export function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <div />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><App /></RequireAuth>} />
        <Route path="/telegram" element={<RequireAuth><TelegramPage /></RequireAuth>} />
        <Route path="/facebook" element={<RequireAuth><FacebookPage /></RequireAuth>} />
        <Route path="/tiktok" element={<RequireAuth><TiktokPage /></RequireAuth>} />
        {/* Add more platform pages here */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
