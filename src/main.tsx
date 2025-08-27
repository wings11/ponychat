import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TelegramPage from './pages/TelegramPage';
import FacebookPage from './pages/FacebookPage';
import TiktokPage from './pages/TiktokPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
  <Route path="/telegram" element={<TelegramPage />} />
  <Route path="/facebook" element={<FacebookPage />} />
  <Route path="/tiktok" element={<TiktokPage />} />
        {/* Add more platform pages here */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
