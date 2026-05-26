import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Trash2, Plus } from 'lucide-react';

export default function ConfirmationModal({ type, message, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleConfirm = async () => {
    setLoading(true);
    setProgress(0);
    await onConfirm();
    setProgress(100);
    // Close shortly after to let the progress bar finish; data updates reactively
    // through React Query invalidation (no page reload needed).
    setTimeout(() => {
      onCancel?.();
    }, 300);
  };

  const icons = {
    delete: <Trash2 className="w-12 h-12 text-red-500" />,
    save: <CheckCircle className="w-12 h-12 text-green-500" />,
    add: <Plus className="w-12 h-12 text-[#f1889b]" />
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-[#f1889b] animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-4">Processing...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              {icons[type]}
            </div>
            <p className="text-center text-gray-800 text-lg font-medium mb-6">
              {message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors ${
                  type === 'delete' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90'
                }`}
              >
                Confirm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}