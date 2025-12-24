'use client';

import { RoomStatus } from '@/types';

interface SessionControlsProps {
  status: RoomStatus;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onViewSummary: () => void;
  isLoading: boolean;
}

export default function SessionControls({
  status,
  onPause,
  onResume,
  onEnd,
  onViewSummary,
  isLoading,
}: SessionControlsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Session
      </h3>

      {/* Status indicator */}
      <div className="mb-4 p-3 rounded-xl bg-slate-50">
        <p className="text-xs text-slate-500 mb-1">Status</p>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'active' ? 'bg-green-500' :
            status === 'paused' ? 'bg-amber-500' :
            'bg-slate-400'
          }`} />
          <span className={`font-semibold capitalize ${
            status === 'active' ? 'text-green-700' :
            status === 'paused' ? 'text-amber-700' :
            'text-slate-600'
          }`}>
            {status}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Pause/Resume button */}
        {status === 'active' && (
          <button
            onClick={onPause}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-amber-500 text-white font-medium rounded-xl
                     hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pause Session
          </button>
        )}

        {status === 'paused' && (
          <button
            onClick={onResume}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-xl
                     hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resume Session
          </button>
        )}

        {/* End session button */}
        {status !== 'completed' && (
          <button
            onClick={onEnd}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-red-500 text-white font-medium rounded-xl
                     hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            End Session
          </button>
        )}

        {/* View summary button */}
        <button
          onClick={onViewSummary}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl
                   hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Summary
        </button>
      </div>
    </div>
  );
}

