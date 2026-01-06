import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/style.css';
import App from './App';
import { ToastProvider } from './components/ui/Toast';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);