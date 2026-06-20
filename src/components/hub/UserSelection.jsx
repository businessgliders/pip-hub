import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

const getPinkGradient = (index) => {
  const pinkGradients = [
    'from-[#f9a8c4] to-[#f1889b]',
    'from-[#f7b1bd] to-[#ed6f86]',
    'from-[#fcc2d7] to-[#f7b1bd]',
    'from-[#f1889b] to-[#e85d7b]',
    'from-[#fdb4d0] to-[#f89dbe]'
  ];
  return pinkGradients[index % pinkGradients.length];
};

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getDisplayName = (user, fullName) => {
  if (user?.is_owner) {
    return 'Front Desk';
  }
  return fullName ? fullName.split(' ')[0] : (user?.email || '').split('@')[0];
};

export default function UserSelection({ onUserSelected, onClose, currentGradient = 'default' }) {
  useBodyScrollLock(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await base44.functions.invoke('getAllUsers', {});
        const allUsers = response.data.users || [];
        // Sort with Front Desk (owner account) first.
        // Emails are masked server-side; use the `is_owner` flag instead.
        const sortedUsers = allUsers.sort((a, b) => {
          if (a.is_owner) return -1;
          if (b.is_owner) return 1;
          return 0;
        });
        setUsers(sortedUsers);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserClick = (user) => {
    // Skip the intermediate "Sign in with Google" screen — go straight to the
    // Google login flow when a user tile is clicked.
    setSelectedUser(user);
    setError('');
    base44.auth.redirectToLogin();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <p className="text-white text-lg">Loading users...</p>
      </div>
    );
  }



  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50 p-4">

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl">
          <h1 className="text-5xl md:text-6xl text-white mb-8 text-center md:text-left" style={{ fontFamily: 'Dancing Script, cursive' }}>Select User</h1>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-x-0 gap-y-4 md:gap-6 w-full justify-center">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="flex flex-col items-center"
              >
                <button
                  onClick={() => handleUserClick(user)}
                  className="group focus:outline-none transition-transform duration-300 hover:scale-105 w-full flex justify-center"
                >
                  <div className={`w-20 h-20 md:w-32 md:h-32 rounded-lg bg-gradient-to-br ${getPinkGradient(index)} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow`}>
                    <span className="text-3xl md:text-5xl font-bold text-white/90">{getInitials(user.full_name)}</span>
                  </div>
                </button>
                <p className="text-gray-300 text-xs md:text-base font-medium text-center truncate w-20 md:w-32 mt-3">
                  {getDisplayName(user, user.full_name.split(' ')[0])}
                </p>
              </div>
            ))}

            {/* Add New User Tile */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="group focus:outline-none transition-transform duration-300 hover:scale-105 w-full flex justify-center"
              >
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow border-2 border-dashed border-white/40">
                  <span className="text-4xl md:text-6xl font-light text-white/90">+</span>
                </div>
              </button>
              <p className="text-gray-300 text-xs md:text-base font-medium text-center truncate w-20 md:w-32 mt-3">
                New User
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-gray-400 text-sm py-6 flex flex-col items-center gap-3">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/ad4ccf659_PiPHub.png"
          alt="PiP Hub"
          className="h-12 md:h-16 rounded-lg"
        />
        © 2026 Pilates in Pink™ • All rights reserved
      </footer>
    </div>
  );
}