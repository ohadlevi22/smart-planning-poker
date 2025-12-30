'use client';

import { useState } from 'react';

interface AgreedPointsSelectorProps {
  currentAgreedPoints?: number;
  averageVote: number;
  onSetPoints: (points: number) => void;
  isLoading: boolean;
}

const STORY_POINTS = [1, 2, 3, 4, 5, 8, 13, 16, 21];

export default function AgreedPointsSelector({
  currentAgreedPoints,
  averageVote,
  onSetPoints,
  isLoading,
}: AgreedPointsSelectorProps) {
  const [customValue, setCustomValue] = useState('');

  const handleCustomSubmit = () => {
    const value = parseInt(customValue);
    if (!isNaN(value) && value > 0) {
      onSetPoints(value);
      setCustomValue('');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 p-6">
      <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Set Agreed Points
      </h3>

      {/* Suggestion based on average */}
      <div className="mb-4 p-3 bg-white rounded-xl">
        <p className="text-xs text-slate-500 mb-1">Suggested (based on average)</p>
        <p className="text-2xl font-bold text-blue-600">{Math.round(averageVote)}</p>
      </div>

      {/* Quick select buttons */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2">Quick select</p>
        <div className="flex flex-wrap gap-2">
          {STORY_POINTS.map((points) => (
            <button
              key={points}
              onClick={() => onSetPoints(points)}
              disabled={isLoading}
              className={`
                px-3 py-2 rounded-lg font-semibold text-sm transition-all
                ${currentAgreedPoints === points
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-blue-100 border border-slate-200'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {points}
            </button>
          ))}
        </div>
      </div>

      {/* Custom value input */}
      <div className="flex gap-2">
        <input
          type="number"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Custom value"
          min="1"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleCustomSubmit}
          disabled={isLoading || !customValue}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
        >
          Set
        </button>
      </div>

      {/* Current agreed points */}
      {currentAgreedPoints !== undefined && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-xl">
          <p className="text-xs text-green-600 mb-1">Agreed estimate</p>
          <p className="text-2xl font-bold text-green-700">{currentAgreedPoints} points</p>
        </div>
      )}
    </div>
  );
}


