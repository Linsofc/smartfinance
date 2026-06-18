import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataCacheProvider } from './context/DataCacheContext';
import { TransactionProvider } from './context/TransactionContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataCacheProvider>
          <TransactionProvider>
            <App />
          </TransactionProvider>
        </DataCacheProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
