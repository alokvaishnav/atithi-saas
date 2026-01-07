import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // 🟢 Loads Tailwind & Global Styles

// 🚀 ENTRY POINT
// CRITICAL NOTE: Do NOT wrap <App /> in <BrowserRouter> here.
// The Router is already handled inside App.jsx to prevent routing conflicts.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);