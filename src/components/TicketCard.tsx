'use client';

import { Ticket } from '@/types';

interface TicketCardProps {
  ticket: Ticket;
  ticketNumber: number;
  totalTickets: number;
}

export default function TicketCard({ ticket, ticketNumber, totalTickets }: TicketCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 w-full">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-slate-500">
          Ticket {ticketNumber} of {totalTickets}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-2 bg-slate-200 rounded-full w-32 overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(ticketNumber / totalTickets) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Ticket key badge */}
      <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-mono font-semibold mb-4">
        {ticket.key}
      </div>
      
      {/* Ticket summary */}
      <h2 className="text-xl font-semibold text-slate-800 leading-relaxed">
        {ticket.summary}
      </h2>
      
      {/* Status indicator */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {ticket.isRevealed ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-600 font-medium">Votes revealed</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm text-amber-600 font-medium">Voting in progress</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

