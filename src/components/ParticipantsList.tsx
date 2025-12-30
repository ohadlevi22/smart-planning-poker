'use client';

import { Participant, Vote } from '@/types';

interface ParticipantsListProps {
  participants: Participant[];
  votes: Vote[];
  isRevealed: boolean;
  currentUserId: string | null;
}

export default function ParticipantsList({ 
  participants, 
  votes, 
  isRevealed,
  currentUserId 
}: ParticipantsListProps) {
  const getVoteForParticipant = (participantId: string): Vote | undefined => {
    return votes.find(v => v.oderId === participantId);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Participants ({participants.length})
      </h3>
      
      <ul className="space-y-3">
        {participants.map((participant) => {
          const vote = getVoteForParticipant(participant.id);
          const hasVoted = !!vote;
          const isCurrentUser = participant.id === currentUserId;
          
          return (
            <li 
              key={participant.id}
              className={`
                flex items-center justify-between p-3 rounded-xl transition-colors
                ${isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  ${participant.isAdmin 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                    : 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                  }
                `}>
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <p className={`font-medium ${isCurrentUser ? 'text-blue-700' : 'text-slate-700'}`}>
                    {participant.name}
                    {isCurrentUser && <span className="text-xs text-blue-500 ml-2">(You)</span>}
                  </p>
                  {participant.isAdmin && (
                    <span className="text-xs text-amber-600 font-medium">Admin</span>
                  )}
                </div>
              </div>
              
              {/* Vote status */}
              <div className="flex items-center">
                {isRevealed && hasVoted ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-700 bg-white px-3 py-1 rounded-lg shadow-sm border">
                      {vote.value}
                    </span>
                  </div>
                ) : hasVoted ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Voted</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-5 h-5 rounded-full border-2 border-current" />
                    <span className="text-sm">Waiting</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


