import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// On the inbox subdomain, use a dedicated favicon, tab title, and
// "Add to Home Screen" icon (iOS apple-touch-icon + PWA manifest icon).
// All other domains keep the existing icon defined in index.html.
if (typeof window !== 'undefined' && window.location.hostname.startsWith('inbox.')) {
  const INBOX_FAVICON = 'https://base44.app/api/apps/69841af9c747b033a60780f2/files/mp/public/69841af9c747b033a60780f2/f9b0f0254_inbox-icon.png';
  const INBOX_NAME = 'PiP Inbox';

  // Favicon (browser tab)
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = INBOX_FAVICON;
  document.title = INBOX_NAME;

  // iOS "Add to Home Screen" icon
  const setLink = (rel) => {
    let el = document.querySelector(`link[rel='${rel}']`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = INBOX_FAVICON;
  };
  setLink('apple-touch-icon');
  setLink('apple-touch-icon-precomposed');

  // iOS web-app meta
  const setMeta = (name, content) => {
    let m = document.querySelector(`meta[name='${name}']`);
    if (!m) {
      m = document.createElement('meta');
      m.name = name;
      document.head.appendChild(m);
    }
    m.content = content;
  };
  setMeta('apple-mobile-web-app-capable', 'yes');
  setMeta('apple-mobile-web-app-title', INBOX_NAME);

  // Android/PWA "Add to Home Screen" icon — override the manifest with an
  // inline one pointing at the inbox icon.
  const manifest = {
    name: INBOX_NAME,
    short_name: INBOX_NAME,
    display: 'standalone',
    icons: [
      { src: INBOX_FAVICON, sizes: '192x192', type: 'image/png' },
      { src: INBOX_FAVICON, sizes: '512x512', type: 'image/png' },
    ],
  };
  const blobUrl = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: 'application/json' })
  );
  let manifestLink = document.querySelector("link[rel='manifest']");
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = blobUrl;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)