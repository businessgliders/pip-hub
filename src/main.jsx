import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// On the inbox subdomain, use a dedicated favicon + tab title.
// All other domains keep the existing icon defined in index.html.
if (typeof window !== 'undefined' && window.location.hostname.startsWith('inbox.')) {
  const INBOX_FAVICON = 'https://base44.app/api/apps/69841af9c747b033a60780f2/files/mp/public/69841af9c747b033a60780f2/f9b0f0254_inbox-icon.png';
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = INBOX_FAVICON;
  document.title = 'PiP Inbox';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)