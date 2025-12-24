'use client';

import { SessionSummary, TicketSummary } from '@/types';
import { useMemo } from 'react';

interface SessionSummaryViewProps {
  summary: SessionSummary;
  onClose: () => void;
  onExportCSV: () => void;
}

interface TicketGroupSummary {
  parentKey: string;
  parentSummary: string;
  tickets: TicketSummary[];
  totalPoints: number;
}

export default function SessionSummaryView({
  summary,
  onClose,
  onExportCSV,
}: SessionSummaryViewProps) {
  // Group tickets by parent
  const groupedTickets = useMemo(() => {
    const groups = new Map<string, TicketGroupSummary>();
    const noParentKey = '__no_parent__';

    for (const ticket of summary.tickets) {
      const key = ticket.parentKey || noParentKey;
      
      if (!groups.has(key)) {
        groups.set(key, {
          parentKey: ticket.parentKey || '',
          parentSummary: ticket.parentSummary || 'Ungrouped Tickets',
          tickets: [],
          totalPoints: 0,
        });
      }
      
      const group = groups.get(key)!;
      group.tickets.push(ticket);
      if (ticket.agreedPoints !== undefined) {
        group.totalPoints += ticket.agreedPoints;
      }
    }

    // Sort: grouped first, then ungrouped
    const result = Array.from(groups.values());
    result.sort((a, b) => {
      if (a.parentKey === '' && b.parentKey !== '') return 1;
      if (a.parentKey !== '' && b.parentKey === '') return -1;
      return a.parentSummary.localeCompare(b.parentSummary);
    });

    return result;
  }, [summary.tickets]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Session Summary</h2>
            <p className="text-slate-500">Room: {summary.roomCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats cards */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Tickets</p>
              <p className="text-3xl font-bold text-slate-800">{summary.totalTickets}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Estimated</p>
              <p className="text-3xl font-bold text-green-600">{summary.estimatedTickets}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Points</p>
              <p className="text-3xl font-bold text-blue-600">{summary.totalPoints}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Points</p>
              <p className="text-3xl font-bold text-purple-600">{summary.averagePoints}</p>
            </div>
          </div>
        </div>

        {/* Tickets grouped by parent */}
        <div className="flex-1 overflow-auto p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Ticket Details (Grouped by Epic/Parent)
          </h3>
          
          <div className="space-y-6">
            {groupedTickets.map((group, groupIndex) => (
              <div key={groupIndex} className="border border-slate-200 rounded-xl overflow-hidden">
                {/* Group header */}
                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {group.parentKey && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-mono font-semibold">
                          {group.parentKey}
                        </span>
                      )}
                      <span className="font-semibold text-indigo-900">{group.parentSummary}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">{group.tickets.length} tickets</span>
                      {group.totalPoints > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                          {group.totalPoints} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Tickets table */}
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Summary</th>
                      <th className="text-center py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Votes</th>
                      <th className="text-center py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Avg</th>
                      <th className="text-center py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Agreed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.tickets.map((ticket, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-mono font-semibold">
                            {ticket.key}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700 max-w-xs">
                          <div className="truncate" title={ticket.summary}>
                            {ticket.summary}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1 flex-wrap">
                            {ticket.votes.length > 0 ? (
                              ticket.votes.map((vote, vi) => (
                                <span
                                  key={vi}
                                  className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                                  title={vote.oderName}
                                >
                                  {vote.value}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-medium text-slate-600">
                          {ticket.votes.length > 0 ? ticket.averageVote : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {ticket.agreedPoints !== undefined ? (
                            <span className="inline-flex px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                              {ticket.agreedPoints}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with participants and export */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Participants</p>
            <div className="flex gap-2 flex-wrap">
              {summary.participants.map((name, i) => (
                <span key={i} className="inline-flex px-2 py-1 bg-white text-slate-600 rounded text-sm border border-slate-200">
                  {name}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onExportCSV}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl
                     hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
