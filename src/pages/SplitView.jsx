import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCw, ExternalLink, X, Globe, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

// Split-view page: left = mobile-sized AppHub, right = embedded browser panel.
// Clicking an app in the left panel opens its URL in the right iframe
// (sites that block embedding via X-Frame-Options/CSP will fail — user can
// click "Open in new tab" as a fallback).

const STORAGE_KEY = 'splitview_right_url';

export default function SplitView() {
  // Disable split view on mobile (< 768px) — only available on tablet/desktop.
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [rightUrl, setRightUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [urlInput, setUrlInput] = useState(rightUrl);
  const [iframeKey, setIframeKey] = useState(0);
  const [leftWidth, setLeftWidth] = useState(420); // px
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Persist last URL
  useEffect(() => {
    if (rightUrl) localStorage.setItem(STORAGE_KEY, rightUrl);
  }, [rightUrl]);

  // Listen for in-app navigation requests from the left panel (AppHub)
  // Two channels: custom event (same-window) and postMessage (from the iframe).
  useEffect(() => {
    const openFromUrl = (url) => {
      if (!url) return;
      setRightUrl(url);
      setUrlInput(url);
      setIframeKey(k => k + 1);
    };
    const eventHandler = (e) => openFromUrl(e.detail?.url);
    const messageHandler = (e) => {
      if (e.data?.type === 'splitview:open-url') openFromUrl(e.data.url);
    };
    window.addEventListener('splitview:open-url', eventHandler);
    window.addEventListener('message', messageHandler);
    return () => {
      window.removeEventListener('splitview:open-url', eventHandler);
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  // Resize divider — uses pointer events with pointer capture so dragging stays
  // smooth even when the cursor crosses over the iframes (which would normally
  // swallow mouse events and "lock" the drag).
  const dividerRef = useRef(null);
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dividerRef.current?.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const min = 320;
    const max = rect.width - 320;
    setLeftWidth(Math.min(Math.max(x, min), max));
  };
  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    dividerRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const normalizeUrl = (u) => {
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) return `https://${u}`;
    return u;
  };

  const submitUrl = (e) => {
    e?.preventDefault();
    const u = normalizeUrl(urlInput.trim());
    setRightUrl(u);
    setIframeKey(k => k + 1);
  };

  const reload = () => setIframeKey(k => k + 1);
  const clear = () => {
    setRightUrl('');
    setUrlInput('');
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100 p-6">
        <div className="text-center max-w-sm">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">Split View not available on mobile</p>
          <p className="text-sm text-gray-500 mb-6">
            Please use a tablet or desktop device to access the Split View.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex bg-gray-100 overflow-hidden"
      style={{ cursor: isDragging ? 'col-resize' : undefined, userSelect: isDragging ? 'none' : undefined }}
    >
      {/* While dragging, overlay covers iframes so they don't capture pointer events. */}
      {isDragging && <div className="fixed inset-0 z-[100]" style={{ cursor: 'col-resize' }} /> }
      {/* LEFT: AppHub at mobile width */}
      <div
        style={{ width: leftWidth }}
        className="h-full flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden flex flex-col"
      >
        <div className="h-[45px] flex items-center justify-between px-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <Link
            to="/"
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Exit Split View
          </Link>
          <span className="text-xs font-medium text-gray-500">Dashboard</span>
        </div>
        {/* Render AppHub inside an iframe so it sees a true mobile viewport width.
            This makes the dashboard's mobile breakpoints (sm/md) activate correctly. */}
        <iframe
          src="/?splitview=1"
          title="Dashboard mobile view"
          className="flex-1 w-full border-0 bg-white"
        />
      </div>

      {/* DIVIDER — pointer events + pointer capture for smooth, lock-free dragging */}
      <div
        ref={dividerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-1.5 h-full flex-shrink-0 cursor-col-resize group flex items-center justify-center bg-gray-200 hover:bg-blue-400 transition-colors relative z-[101] touch-none ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        title="Drag to resize"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-white pointer-events-none" />
      </div>

      {/* RIGHT: Browser panel */}
      <div className="flex-1 h-full flex flex-col bg-white min-w-0">
        <div className="h-[45px] flex items-center gap-2 px-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={reload}
            disabled={!rightUrl}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30"
            title="Reload"
          >
            <RotateCw className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <form onSubmit={submitUrl} className="flex-1 flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-full px-3 py-1.5 focus-within:border-blue-400">
              <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mr-2" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL or click an app on the left…"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              />
            </div>
          </form>
          {rightUrl && (
            <>
              <a
                href={rightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
              </a>
              <button
                onClick={clear}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200"
                title="Close"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </>
          )}
        </div>

        <div className="flex-1 bg-gray-50 relative">
          {rightUrl ? (
            <iframe
              key={iframeKey}
              src={rightUrl}
              className="w-full h-full border-0"
              title="Browser panel"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              referrerPolicy="no-referrer-when-downgrade"
              allow="clipboard-read; clipboard-write; geolocation; microphone; camera; autoplay"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md p-8">
                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No site loaded</p>
                <p className="text-sm text-gray-500">
                  Click an app on the left panel, or type a URL above to load a website here.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Note: Some sites (e.g. Google, banking) block embedding. Use the
                  <ExternalLink className="w-3 h-3 inline mx-1" />
                  button to open them in a new tab instead.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}