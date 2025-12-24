'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setUserSession, generateUserId } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [adminName, setAdminName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinerName, setJoinerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: adminName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setUserSession(data.data.adminId, adminName.trim(), data.data.room.code);
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
    if (!roomCode.trim() || !joinerName.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      const userId = generateUserId();
      const response = await fetch(`/api/rooms/${roomCode.trim().toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, name: joinerName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // Use the ID from the server (may be different if reconnecting)
        const actualUserId = data.data.oderId || userId;
        setUserSession(actualUserId, joinerName.trim(), data.data.room.code);
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-10">
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

        {/* Create Room Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-4 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
            Create New Room
          </h2>
          
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label htmlFor="adminName" className="block text-sm font-medium text-slate-400 mb-2">
                Your Name
              </label>
              <input
                id="adminName"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={!adminName.trim() || isCreating}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl
                       shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-slate-500 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Join Room Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </span>
            Join Existing Room
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
            <div>
              <label htmlFor="joinerName" className="block text-sm font-medium text-slate-400 mb-2">
                Your Name
              </label>
              <input
                id="joinerName"
                type="text"
                value={joinerName}
                onChange={(e) => setJoinerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                         transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={!roomCode.trim() || !joinerName.trim() || isJoining}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl
                       shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-emerald-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>

        {/* View Reports Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/reports')}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white 
                     hover:bg-white/5 rounded-xl transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Saved Reports
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-sm mt-4">
          Built for agile teams 🚀
        </p>
      </div>
    </main>
  );
}
