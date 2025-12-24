'use client';

import { Ticket } from '@/types';
import { useState, useMemo } from 'react';
import { formatJiraMarkup } from '@/lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  ticketNumber: number;
  totalTickets: number;
}

export default function TicketCard({ ticket, ticketNumber, totalTickets }: TicketCardProps) {
  const [showDescription, setShowDescription] = useState(false);
  
  // Format the description to clean up Jira markup
  const formattedDescription = useMemo(() => {
    return ticket.description ? formatJiraMarkup(ticket.description) : '';
  }, [ticket.description]);

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

      {/* Parent info */}
      {ticket.parentKey && ticket.parentSummary && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="font-mono">{ticket.parentKey}</span>
          </div>
          <p className="text-sm text-indigo-800 font-medium">{ticket.parentSummary}</p>
        </div>
      )}
      
      {/* Ticket key badge and assignee */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-mono font-semibold">
          {ticket.key}
        </div>
        
        {ticket.assignee && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
              {ticket.assignee.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-700 font-medium">{ticket.assignee}</span>
          </div>
        )}
      </div>
      
      {/* Ticket summary */}
      <h2 className="text-xl font-semibold text-slate-800 leading-relaxed">
        {ticket.summary}
      </h2>

      {/* Description (collapsible) */}
      {formattedDescription && (
        <div className="mt-4">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showDescription ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{showDescription ? 'Hide' : 'Show'} Description</span>
          </button>
          
          {showDescription && (
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
                {formattedDescription}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Status indicator */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between">
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
          
          {/* Agreed points badge */}
          {ticket.agreedPoints !== undefined && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold text-green-700">{ticket.agreedPoints} pts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
