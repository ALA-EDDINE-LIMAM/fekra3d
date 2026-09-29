import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { CartProvider } from './context/CartContext';
import ThemeProvider from './context/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import { fetchCatalog } from './utils/products';
import { Analytics } from '@vercel/analytics/react';

fetchCatalog().catch((error) => console.error('Failed to preload products:', error));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
    <Analytics />
  </React.StrictMode>
);
