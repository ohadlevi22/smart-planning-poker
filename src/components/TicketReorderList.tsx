'use client';

import { Ticket } from '@/types';
import { useState, useCallback } from 'react';

interface TicketReorderListProps {
  tickets: Ticket[];
  onReorder: (ticketIds: string[]) => void;
  onStartPlanning: () => void;
  isLoading: boolean;
}

export default function TicketReorderList({ 
  tickets, 
  onReorder, 
  onStartPlanning, 
  isLoading 
}: TicketReorderListProps) {
  const [orderedTickets, setOrderedTickets] = useState(tickets);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      setDraggedIndex(null);
      return;
    }

    const newTickets = [...orderedTickets];
    const [draggedTicket] = newTickets.splice(draggedIndex, 1);
    newTickets.splice(dropIndex, 0, draggedTicket);
    
    setOrderedTickets(newTickets);
    onReorder(newTickets.map(t => t.id));
    setDragOverIndex(null);
    setDraggedIndex(null);
  }, [draggedIndex, orderedTickets, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Move ticket up
  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newTickets = [...orderedTickets];
    [newTickets[index - 1], newTickets[index]] = [newTickets[index], newTickets[index - 1]];
    setOrderedTickets(newTickets);
    onReorder(newTickets.map(t => t.id));
  }, [orderedTickets, onReorder]);

  // Move ticket down
  const moveDown = useCallback((index: number) => {
    if (index === orderedTickets.length - 1) return;
    const newTickets = [...orderedTickets];
    [newTickets[index], newTickets[index + 1]] = [newTickets[index + 1], newTickets[index]];
    setOrderedTickets(newTickets);
    onReorder(newTickets.map(t => t.id));
  }, [orderedTickets, onReorder]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Order Your Tickets</h2>
          <p className="text-slate-500 text-sm mt-1">
            Drag and drop to reorder tickets before starting the planning session
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-blue-700 font-semibold">{orderedTickets.length} tickets</span>
        </div>
      </div>

      {/* Ticket list */}
      <div className="space-y-2 mb-6 max-h-[500px] overflow-y-auto">
        {orderedTickets.map((ticket, index) => (
          <div
            key={ticket.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing
              ${draggedIndex === index 
                ? 'opacity-50 border-blue-300 bg-blue-50' 
                : dragOverIndex === index 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }
            `}
          >
            {/* Order number */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-600">{index + 1}</span>
            </div>

            {/* Drag handle */}
            <div className="flex-shrink-0 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>

            {/* Ticket info */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {ticket.key}
                </span>
                {ticket.parentKey && (
                  <span className="text-xs text-slate-400">
                    → {ticket.parentKey}
                  </span>
                )}
                {ticket.assignee && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {ticket.assignee}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 truncate">{ticket.summary}</p>
            </div>

            {/* Move buttons */}
            <div className="flex-shrink-0 flex flex-col gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className={`p-1 rounded transition-colors ${
                  index === 0 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === orderedTickets.length - 1}
                className={`p-1 rounded transition-colors ${
                  index === orderedTickets.length - 1 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Start button */}
      <div className="flex justify-center pt-4 border-t border-slate-100">
        <button
          onClick={onStartPlanning}
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Starting...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Start Planning Session</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

