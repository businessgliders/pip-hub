import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

export default function PasswordPrompt({ onClose, onSuccess }) {
  useBodyScrollLock(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple password check - in production, this should be more secure
    if (password === 'admin123') {
      onSuccess();
      onClose();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Admin Access</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter admin password"
              className="bg-white/60 border-gray-200"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white"
          >
            Unlock Admin Mode
          </Button>
        </form>
      </div>
    </div>
  );
}