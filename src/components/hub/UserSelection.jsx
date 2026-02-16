import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

const getDisplayName = (email, fullName) => {
  if (email === 'info@pilatesinpinkstudio.com') {
    return 'Front Desk';
  }
  return fullName.split(' ')[0];
};

export default function UserSelection({ onUserSelected, onClose, currentGradient = 'default' }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await base44.functions.invoke('getAllUsers', {});
        const allUsers = response.data.users || [];
        // Sort with Front Desk (owner accounts) first
        const sortedUsers = allUsers.sort((a, b) => {
          const aIsOwner = a.email === 'info@pilatesinpinkstudio.com';
          const bIsOwner = b.email === 'info@pilatesinpinkstudio.com';
          if (aIsOwner && !bIsOwner) return -1;
          if (!aIsOwner && bIsOwner) return 1;
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

  const handleUserClick = async (user) => {
    try {
      sessionStorage.setItem('selectedUserEmail', user.email);
      await base44.auth.redirectToLogin();
    } catch (err) {
      setError('Authentication failed');
    }
  };

  const handleGoogleAuth = async () => {
    if (!selectedUser) return;
    try {
      // Save selected user email and trigger standard Google auth
      sessionStorage.setItem('selectedUserEmail', selectedUser.email);
      await base44.auth.redirectToLogin();
    } catch (err) {
      setError('Authentication failed');
    }
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
      <div className="flex flex-col items-center pt-8 mb-12">
        <div className="flex justify-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69841af9c747b033a60780f2/c3f456d53_PiPSupport.png"
            alt="Pilates in Pink Support"
            className="h-24 md:h-32 rounded-2xl"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-left">Select User</h1>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full justify-start">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col items-center"
              >
                <button
                  onClick={() => handleUserClick(user)}
                  className="group focus:outline-none transition-transform duration-300 hover:scale-105 w-full flex justify-center"
                >
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gradient-to-br ${getColorForUser(user.email, currentGradient)} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow`}>
                    <span className="text-4xl md:text-5xl font-bold text-white/90">{getInitials(user.full_name)}</span>
                  </div>
                </button>
                <p className="text-gray-300 text-sm md:text-base font-medium text-center truncate w-24 md:w-32 mt-3">
                  {getDisplayName(user.email, user.full_name.split(' ')[0])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="text-center text-gray-400 text-sm py-6">
        © 2026 Pilates in Pink™ • All rights reserved
      </footer>
    </div>
  );
}