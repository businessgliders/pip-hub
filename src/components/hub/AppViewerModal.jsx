import React, { useState } from 'react';
import { X, ExternalLink, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

export default function AppViewerModal({ app, onClose }) {
  useBodyScrollLock(true);
  const [iframeKey, setIframeKey] = useState(0);

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header with close button */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
          <div className="flex items-center gap-3">
            {app.icon_url && (
              <img src={app.icon_url} alt={app.name} className="w-8 h-8 object-contain" />
            )}
            <h3 className="text-white font-semibold text-lg">{app.name}</h3>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <Button
              onClick={handleReload}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              title="Reload"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => window.open(app.url, '_blank', 'noopener,noreferrer')}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Iframe */}
        <iframe
          key={iframeKey}
          src={app.url}
          className="w-full h-full bg-white"
          title={app.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}