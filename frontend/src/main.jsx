import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'; // 👈 Import ErrorBoundary

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary> {/* 👈 Wrap the entire App here */}
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)