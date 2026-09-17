import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './store/app';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/chat.css';
import './styles/admin.css';

dayjs.locale('zh-cn');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
