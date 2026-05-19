import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import EndShiftModal from '../components/hub/EndShift/EndShiftModal';

export default function EndShiftPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2]">
        <div className="w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fbe0e2] via-[#f7b1bd] to-[#fbe0e2]">
      <EndShiftModal
        defaultSignature={user?.full_name || ''}
        onClose={() => navigate('/')}
        onViewReports={() => navigate('/end-of-day')}
      />
    </div>
  );
}