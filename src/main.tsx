import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyThemeSettings, loadThemeSettings } from './theme';

// 저장된 화면 테마를 첫 화면을 그리기 전에 적용 (깜빡임 방지)
applyThemeSettings(loadThemeSettings());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
