'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Room, Ticket } from '@/types';
import { getUserSession, setUserSession, generateUserId, copyToClipboard } from '@/lib/utils';
import TicketCard from '@/components/TicketCard';
import VotingCards from '@/components/VotingCards';
import ParticipantsList from '@/components/ParticipantsList';
import ResultsPanel from '@/components/ResultsPanel';
import AdminControls from '@/components/AdminControls';
import CSVUploader from '@/components/CSVUploader';

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { code } = use(params);
  const router = useRouter();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinName, setJoinName] = useState('');

  const isAdmin = room && userId === room.adminId;
  const currentTicket: Ticket | undefined = room?.tickets[room.currentTicketIndex];
  const myVote = currentTicket?.votes.find(v => v.oderId === userId);

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${code}`);
      const data = await response.json();
      
      if (data.success) {
        setRoom(data.data);
        setError(null);
      } else {
        setError(data.error || 'Room not found');
      }
    } catch {
      setError('Failed to load room');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  // Initialize session
  useEffect(() => {
    const session = getUserSession();
    
    if (session.id && session.name && session.roomCode === code.toUpperCase()) {
      setUserId(session.id);
      setUserName(session.name);
      // Re-join to ensure we're in the room
      fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session.id, name: session.name }),
      });
    } else {
      // Need to join
      setShowJoinModal(true);
    }
    
    fetchRoom();
  }, [code, fetchRoom]);

  // Polling for updates
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [userId, fetchRoom]);

  // Handle join
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;

    setIsActionLoading(true);
    try {
      const newUserId = generateUserId();
      const response = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newUserId, name: joinName.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setUserId(newUserId);
        setUserName(joinName.trim());
        setUserSession(newUserId, joinName.trim(), code.toUpperCase());
        setRoom(data.data);
        setShowJoinModal(false);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to join room');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle vote
  const handleVote = async (value: number) => {
    if (!userId || !userName || currentTicket?.isRevealed) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/rooms/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oderId: userId, oderName: userName, value }),
      });

      const data = await response.json();
      if (data.success) {
        setRoom(data.data);
      }
    } catch {
      // Silent fail, will sync on next poll
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle reveal
  const handleReveal = async () => {
    if (!isAdmin) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/rooms/${code}/reveal`, { method: 'POST' });
      const data = await response.json();
      if (data.success) setRoom(data.data);
    } catch {
      // Silent fail
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle next
  const handleNext = async () => {
    if (!isAdmin) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/rooms/${code}/next`, { method: 'POST' });
      const data = await response.json();
      if (data.success) setRoom(data.data);
    } catch {
      // Silent fail
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle previous
  const handlePrev = async () => {
    if (!isAdmin) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/rooms/${code}/prev`, { method: 'POST' });
      const data = await response.json();
      if (data.success) setRoom(data.data);
    } catch {
      // Silent fail
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle reset
  const handleReset = async () => {
    if (!isAdmin) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/rooms/${code}/reset`, { method: 'POST' });
      const data = await response.json();
      if (data.success) setRoom(data.data);
    } catch {
      // Silent fail
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle CSV upload
  const handleUploadTickets = async (tickets: Omit<Ticket, 'votes' | 'isRevealed'>[]) => {
    if (!isAdmin) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/rooms/${code}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets }),
      });

      const data = await response.json();
      if (data.success) setRoom(data.data);
    } catch {
      setError('Failed to upload tickets');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle copy room code
  const handleCopyCode = async () => {
    const success = await copyToClipboard(code.toUpperCase());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading room...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error && !room) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Room Not Found</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  // Join modal
  if (showJoinModal) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Join Room</h1>
          <p className="text-slate-600 mb-6 text-center">
            Enter your name to join room <span className="font-mono font-bold text-blue-600">{code.toUpperCase()}</span>
          </p>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="joinName" className="block text-sm font-medium text-slate-700 mb-2">
                Your Name
              </label>
              <input
                id="joinName"
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={!joinName.trim() || isActionLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isActionLoading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
          
          <button
            onClick={() => router.push('/')}
            className="w-full mt-4 py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl
                     hover:bg-slate-200 transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const ticketsLoaded = room && room.tickets.length > 0;
  const allDone = room && room.currentTicketIndex >= room.tickets.length - 1 && currentTicket?.isRevealed;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Planning Poker</h1>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors group"
                >
                  <span className="font-mono font-bold text-blue-600 tracking-wider">{code.toUpperCase()}</span>
                  {copied ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                {ticketsLoaded && (
                  <span className="text-sm text-slate-500">
                    {room.currentTicketIndex + 1} / {room.tickets.length}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-slate-500">Logged in as</p>
              <p className="font-medium text-slate-700">{userName}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isAdmin ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
              {userName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!ticketsLoaded ? (
          // No tickets yet
          <div className="flex flex-col items-center justify-center py-16">
            {isAdmin ? (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Your Tickets</h2>
                <p className="text-slate-600 mb-8">Import a Jira CSV export to get started</p>
                <CSVUploader onUpload={handleUploadTickets} isLoading={isActionLoading} />
              </>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-slate-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Waiting for Admin</h2>
                <p className="text-slate-600">The admin is uploading tickets...</p>
              </div>
            )}
          </div>
        ) : allDone ? (
          // All tickets done
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">All Tickets Estimated! 🎉</h2>
            <p className="text-slate-600 mb-8">Great job team! You&apos;ve estimated all {room.tickets.length} tickets.</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Start New Session
            </button>
          </div>
        ) : (
          // Active voting
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main area */}
            <div className="lg:col-span-8 space-y-6">
              {currentTicket && (
                <>
                  <TicketCard
                    ticket={currentTicket}
                    ticketNumber={room.currentTicketIndex + 1}
                    totalTickets={room.tickets.length}
                  />
                  
                  <VotingCards
                    selectedValue={myVote?.value ?? null}
                    onVote={handleVote}
                    disabled={isActionLoading}
                    isRevealed={currentTicket.isRevealed}
                  />
                  
                  <ResultsPanel
                    votes={currentTicket.votes}
                    isRevealed={currentTicket.isRevealed}
                  />
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <ParticipantsList
                participants={room.participants}
                votes={currentTicket?.votes ?? []}
                isRevealed={currentTicket?.isRevealed ?? false}
                currentUserId={userId}
              />
              
              {isAdmin && (
                <AdminControls
                  onReveal={handleReveal}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onReset={handleReset}
                  isRevealed={currentTicket?.isRevealed ?? false}
                  canGoNext={room.currentTicketIndex < room.tickets.length - 1}
                  canGoPrev={room.currentTicketIndex > 0}
                  isLoading={isActionLoading}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

