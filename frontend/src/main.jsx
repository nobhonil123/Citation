import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: { borderRadius: '8px', background: '#333', color: '#fff' },
        success: { style: { background: '#27ae60' } },
        error: { style: { background: '#e74c3c' } },
      }}
    />
    <App />
  </React.StrictMode>,
)
