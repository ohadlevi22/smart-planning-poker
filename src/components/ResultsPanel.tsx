'use client';

import { Vote } from '@/types';
import { calculateVoteStats } from '@/lib/utils';

interface ResultsPanelProps {
  votes: Vote[];
  isRevealed: boolean;
}

const STORY_POINTS = [2, 4, 8, 16];

export default function ResultsPanel({ votes, isRevealed }: ResultsPanelProps) {
  if (!isRevealed || votes.length === 0) {
    return null;
  }

  const { average, mostCommon, distribution } = calculateVoteStats(votes);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 p-6">
      <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Results
      </h3>
      
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Average</p>
          <p className="text-3xl font-bold text-slate-800">{average}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Most Common</p>
          <p className="text-3xl font-bold text-slate-800">{mostCommon ?? '-'}</p>
        </div>
      </div>
      
      {/* Vote distribution */}
      <div className="space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Distribution</p>
        
        <div className="space-y-2">
          {STORY_POINTS.map((points) => {
            const count = distribution[points] || 0;
            const percentage = votes.length > 0 ? (count / votes.length) * 100 : 0;
            
            return (
              <div key={points} className="flex items-center gap-3">
                <span className="w-8 text-sm font-mono font-medium text-slate-600">{points}</span>
                <div className="flex-1 h-6 bg-white rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-16 text-sm text-slate-600 text-right">
                  {count} {count === 1 ? 'vote' : 'votes'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Individual votes */}
      <div className="mt-6 pt-4 border-t border-green-200">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">All Votes</p>
        <div className="flex flex-wrap gap-2">
          {votes.map((vote) => (
            <div 
              key={vote.oderId}
              className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm"
            >
              <span className="text-slate-600">{vote.oderName}</span>
              <span className="font-bold text-blue-600">{vote.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


