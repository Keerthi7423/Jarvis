import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="position:absolute;z-index:99999;background:red;color:white;padding:20px;font-size:16px;">Error: ${e.error?.stack || e.message || 'Unknown error'}</div>` + document.body.innerHTML;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
