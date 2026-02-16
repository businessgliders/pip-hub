import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const profileColors = [
  'from-purple-500 to-purple-700',
  'from-cyan-400 to-cyan-600',
  'from-green-400 to-green-600',
  'from-orange-500 to-orange-700',
  'from-blue-500 to-blue-700',
  'from-pink-500 to-pink-700',
  'from-yellow-400 to-yellow-600',
  'from-red-500 to-red-700'
];

const getColorForUser = (email) => {
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return profileColors[hash % profileColors.length];
};

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getDisplayName = (email, fullName) => {
  if (email === 'info@pilatesinpinkstudio.com' || email === 'gurpreen@pilatesinpinkstudio.com') {
    return 'Front Desk';
  }
  return fullName;
};

export default function UserSelection({ onUserSelected, onClose }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await base44.entities.User.list();
        // Sort with Front Desk (owner accounts) first
        const sortedUsers = allUsers.sort((a, b) => {
          const aIsOwner = a.email === 'info@pilatesinpinkstudio.com' || a.email === 'gurpreen@pilatesinpinkstudio.com';
          const bIsOwner = b.email === 'info@pilatesinpinkstudio.com' || b.email === 'gurpreen@pilatesinpinkstudio.com';
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

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowGoogleAuth(true);
    setError('');
  };

  const handleGoogleAuth = async () => {
    if (!selectedUser) return;
    try {
      // Trigger Google auth and redirect to login with selected user email
      window.location.href = `/?login_email=${encodeURIComponent(selectedUser.email)}&google_auth=true`;
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

  if (showGoogleAuth && selectedUser) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-sm rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorForUser(selectedUser.email)} flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{getInitials(selectedUser.full_name)}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{getDisplayName(selectedUser.email, selectedUser.full_name)}</h2>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowGoogleAuth(false);
                setSelectedUser(null);
                setError('');
              }}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center mb-4">Sign in with Google to continue</p>
            <Button
              onClick={handleGoogleAuth}
              className="w-full bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
            {error && (
              <p className="text-xs text-red-500 text-center mt-3">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <h1 className="text-5xl font-bold text-white mb-12 text-center">Who's accessing?</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user)}
            className="group focus:outline-none transition-transform duration-300 hover:scale-105"
          >
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gradient-to-br ${getColorForUser(user.email)} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-2xl transition-shadow`}>
              <span className="text-4xl md:text-5xl font-bold text-white/90">{getInitials(user.full_name)}</span>
            </div>
            <p className="text-gray-300 text-sm md:text-base font-medium text-center truncate">
              {getDisplayName(user.email, user.full_name.split(' ')[0])}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}