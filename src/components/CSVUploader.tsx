'use client';

import { useRef, useState } from 'react';
import { parseJiraCSV, validateJiraCSV, orderTicketsByParent } from '@/lib/csv-parser';
import { Ticket } from '@/types';

interface CSVUploaderProps {
  onUpload: (tickets: Omit<Ticket, 'votes' | 'isRevealed' | 'agreedPoints'>[]) => void;
  isLoading: boolean;
}

export default function CSVUploader({ onUpload, isLoading }: CSVUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      const content = await file.text();
      
      const validation = validateJiraCSV(content);
      if (!validation.valid) {
        setError(validation.error || 'Invalid CSV format');
        return;
      }

      const tickets = parseJiraCSV(content);
      
      if (tickets.length === 0) {
        setError('No valid tickets found in CSV');
        return;
      }

      // Order tickets by parent for grouped review
      const orderedTickets = orderTicketsByParent(tickets);
      onUpload(orderedTickets);
    } catch {
      setError('Failed to parse CSV file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-4">
          {/* Upload icon */}
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}
          `}>
            <svg 
              className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-semibold text-slate-700">
              {isDragging ? 'Drop your CSV here' : 'Upload Jira CSV Export'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Drag and drop or click to browse
            </p>
          </div>
          
          <div className="text-xs text-slate-400 max-w-md text-center">
            <p>Tickets will be grouped by Parent for organized review</p>
            <p className="mt-1 opacity-70">Supports: Issue key, Summary, Assignee, Description, Parent key, Parent summary</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Upload Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
