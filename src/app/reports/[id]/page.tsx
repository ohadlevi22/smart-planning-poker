'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { SavedReport } from '@/types';
import { getAuthUser } from '@/lib/utils';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default function ReportDetailPage({ params }: ReportPageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  const [report, setReport] = useState<SavedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check for authenticated admin user
    const authUser = getAuthUser();
    if (!authUser) {
      router.push('/login');
      return;
    }
    if (!authUser.isAdmin) {
      router.push('/');
      return;
    }
    fetchReport();
  }, [id, router]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setReport(data.data);
      } else {
        setError(data.error || 'Report not found');
      }
    } catch {
      setError('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTicket = (key: string) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTickets(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    if (!report) return;

    // Create header with participant columns
    const participantNames = report.participants;
    const headers = [
      'Ticket Key',
      'Summary',
      'Parent Key',
      'Parent Summary',
      'Assignee',
      'Agreed Points',
      'Average Vote',
      ...participantNames.map(name => `Vote: ${name}`),
    ];

    // Create rows
    const rows = report.tickets.map(ticket => {
      const votesByParticipant: Record<string, number | string> = {};
      participantNames.forEach(name => {
        const vote = ticket.votes.find(v => v.participantName === name);
        votesByParticipant[name] = vote ? vote.value : '-';
      });

      return [
        ticket.key,
        `"${ticket.summary.replace(/"/g, '""')}"`,
        ticket.parentKey || '',
        ticket.parentSummary ? `"${ticket.parentSummary.replace(/"/g, '""')}"` : '',
        ticket.assignee || '',
        ticket.agreedPoints?.toString() || '',
        ticket.averageVote.toString(),
        ...participantNames.map(name => votesByParticipant[name].toString()),
      ];
    });

    // Add summary row
    rows.push([]);
    rows.push(['SUMMARY']);
    rows.push(['Total Tickets', report.totalTickets.toString()]);
    rows.push(['Estimated Tickets', report.estimatedTickets.toString()]);
    rows.push(['Total Points', report.totalPoints.toString()]);
    rows.push(['Average Points', report.averagePoints.toString()]);
    rows.push(['Participants', report.participants.join(', ')]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/[^a-z0-9]/gi, '_')}_${report.roomCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading report...</p>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Report Not Found</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/reports')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Reports
          </button>
        </div>
      </main>
    );
  }

  // Group tickets by parent
  const ticketsByParent = new Map<string, typeof report.tickets>();
  report.tickets.forEach(ticket => {
    const parentKey = ticket.parentKey || '__no_parent__';
    if (!ticketsByParent.has(parentKey)) {
      ticketsByParent.set(parentKey, []);
    }
    ticketsByParent.get(parentKey)!.push(ticket);
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/reports')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{report.name}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="font-mono">{report.roomCode}</span>
                  <span>•</span>
                  <span>{formatDate(report.createdAt)}</span>
                  <span>•</span>
                  <span>by {report.createdBy}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Total Tickets</p>
            <p className="text-3xl font-bold text-slate-800">{report.totalTickets}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Estimated</p>
            <p className="text-3xl font-bold text-blue-600">{report.estimatedTickets}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Total Points</p>
            <p className="text-3xl font-bold text-green-600">{report.totalPoints}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Avg Points</p>
            <p className="text-3xl font-bold text-purple-600">{report.averagePoints}</p>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Participants ({report.participants.length})</h2>
          <div className="flex flex-wrap gap-2">
            {report.participants.map((name, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Ticket Details</h2>
            <p className="text-sm text-slate-500">Click on a ticket to see individual votes</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Summary</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Agreed</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Avg Vote</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Votes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Array.from(ticketsByParent.entries()).map(([parentKey, tickets]) => (
                  <>
                    {parentKey !== '__no_parent__' && (
                      <tr key={`parent-${parentKey}`} className="bg-amber-50/50">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span className="font-mono">{parentKey}</span>
                            <span className="text-amber-600">•</span>
                            <span className="font-normal">{tickets[0]?.parentSummary || 'Parent'}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {tickets.map((ticket) => (
                      <>
                        <tr
                          key={ticket.key}
                          onClick={() => toggleTicket(ticket.key)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-blue-600 font-medium">{ticket.key}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-800 line-clamp-2">{ticket.summary}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{ticket.assignee || '-'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {ticket.agreedPoints !== undefined ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 font-bold rounded-lg">
                                {ticket.agreedPoints}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-slate-600">{ticket.averageVote}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-sm text-slate-600">{ticket.votes.length}</span>
                              <svg
                                className={`w-4 h-4 text-slate-400 transition-transform ${
                                  expandedTickets.has(ticket.key) ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </td>
                        </tr>
                        {expandedTickets.has(ticket.key) && (
                          <tr key={`${ticket.key}-votes`}>
                            <td colSpan={6} className="px-6 py-4 bg-slate-50">
                              <div className="ml-4 pl-4 border-l-2 border-slate-200">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Individual Votes</p>
                                <div className="flex flex-wrap gap-3">
                                  {ticket.votes.length > 0 ? (
                                    ticket.votes.map((vote, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200"
                                      >
                                        <span className="text-sm text-slate-600">{vote.participantName}</span>
                                        <span className="w-7 h-7 bg-blue-100 text-blue-700 font-bold rounded flex items-center justify-center text-sm">
                                          {vote.value}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-500 italic">No votes recorded</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

