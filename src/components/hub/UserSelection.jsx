import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Lock } from 'lucide-react';

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

export default function UserSelection({ onUserSelected, onClose }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await base44.entities.User.list();
        setUsers(allUsers);
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
    setShowPasswordPrompt(true);
    setError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUser || !password) {
      setError('Password required');
      return;
    }

    try {
      // Validate password via backend
      const response = await base44.functions.invoke('validateUserPassword', {
        email: selectedUser.email,
        password: password,
      });

      if (response.data.valid) {
        // Redirect to login with this user's email
        window.location.href = `/?login_email=${encodeURIComponent(selectedUser.email)}`;
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } catch (err) {
      setError('Authentication failed');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <p className="text-white text-lg">Loading users...</p>
      </div>
    );
  }

  if (showPasswordPrompt && selectedUser) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="w-full max-w-sm rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorForUser(selectedUser.email)} flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{getInitials(selectedUser.full_name)}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedUser.full_name}</h2>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPasswordPrompt(false);
                setSelectedUser(null);
                setPassword('');
                setError('');
              }}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
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
              <Lock className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </form>
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
              {user.full_name.split(' ')[0]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}