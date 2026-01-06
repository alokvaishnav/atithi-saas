import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // 🟢 CRITICAL: Loads Tailwind & Global Styles

// 🚀 ENTRY POINT
// This mounts the React application into the DOM element with id 'root'
// defined in your index.html file.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);