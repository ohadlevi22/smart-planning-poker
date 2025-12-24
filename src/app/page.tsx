'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setUserSession, generateUserId, getAuthUser, clearAuthUser, AuthUser } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const authUser = getAuthUser();
    if (!authUser) {
      router.push('/login');
      return;
    }
    setUser(authUser);
    setIsLoading(false);
  }, [router]);

  const handleCreateRoom = async () => {
    if (!user || !user.isAdmin) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: user.name }),
      });

      const data = await response.json();

      if (data.success) {
        setUserSession(data.data.adminId, user.name, data.data.room.code);
        router.push(`/room/${data.data.room.code}`);
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch {
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !user) return;

    setIsJoining(true);
    setError(null);

    try {
      const userId = generateUserId();
      const response = await fetch(`/api/rooms/${roomCode.trim().toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, name: user.name }),
      });

      const data = await response.json();

      if (data.success) {
        // Use the ID from the server (may be different if reconnecting)
        const actualUserId = data.data.oderId || userId;
        setUserSession(actualUserId, user.name, data.data.room.code);
        router.push(`/room/${data.data.room.code}`);
      } else {
        setError(data.error || 'Room not found');
      }
    } catch {
      setError('Failed to join room. Please check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLogout = () => {
    clearAuthUser();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* User info header */}
        <div className="absolute top-0 right-0 flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="text-white font-medium flex items-center gap-2">
              {user?.name}
              {user?.isAdmin && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                  Admin
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Sign out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Logo and title */}
        <div className="text-center mb-10 pt-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl shadow-blue-500/25 mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Planning Poker
          </h1>
          <p className="text-slate-400">
            Estimate stories together with your team
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Admin: Create Room */}
        {user?.isAdmin && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-4 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              Create New Room
              <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                Admin
              </span>
            </h2>
            
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl
                       shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        )}

        {/* Join Room Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </span>
            Join Room
          </h2>
          
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-slate-400 mb-2">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123"
                maxLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                         transition-all duration-200 uppercase tracking-widest font-mono text-center text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={!roomCode.trim() || isJoining}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl
                       shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-emerald-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>

        {/* Admin: View Reports */}
        {user?.isAdmin && (
          <div className="mt-6">
            <button
              onClick={() => router.push('/reports')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-300 
                       bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Past Reports
              <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                Admin
              </span>
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-600 text-sm mt-8">
          Built for agile teams 🚀
        </p>
      </div>
    </main>
  );
}
