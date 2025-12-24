import { Vote, SessionSummary } from '@/types';

/**
 * Calculate voting statistics
 */
export function calculateVoteStats(votes: Vote[]): {
  average: number;
  mostCommon: number | null;
  distribution: Record<number, number>;
} {
  if (votes.length === 0) {
    return { average: 0, mostCommon: null, distribution: {} };
  }

  const values = votes.map(v => v.value);
  
  // Calculate average
  const sum = values.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / values.length) * 10) / 10;

  // Calculate distribution
  const distribution: Record<number, number> = {};
  for (const value of values) {
    distribution[value] = (distribution[value] || 0) + 1;
  }

  // Find most common (mode)
  let mostCommon: number | null = null;
  let maxCount = 0;
  for (const [value, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = parseInt(value);
    }
  }

  return { average, mostCommon, distribution };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Local storage helpers for participant session
 */
const STORAGE_KEY_USER_ID = 'planning-poker-user-id';
const STORAGE_KEY_USER_NAME = 'planning-poker-user-name';
const STORAGE_KEY_ROOM_CODE = 'planning-poker-room-code';

export function getUserSession(): { id: string | null; name: string | null; roomCode: string | null } {
  if (typeof window === 'undefined') {
    return { id: null, name: null, roomCode: null };
  }
  
  return {
    id: localStorage.getItem(STORAGE_KEY_USER_ID),
    name: localStorage.getItem(STORAGE_KEY_USER_NAME),
    roomCode: localStorage.getItem(STORAGE_KEY_ROOM_CODE),
  };
}

export function setUserSession(id: string, name: string, roomCode: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEY_USER_ID, id);
  localStorage.setItem(STORAGE_KEY_USER_NAME, name);
  localStorage.setItem(STORAGE_KEY_ROOM_CODE, roomCode);
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY_USER_ID);
  localStorage.removeItem(STORAGE_KEY_USER_NAME);
  localStorage.removeItem(STORAGE_KEY_ROOM_CODE);
}

/**
 * Authentication helpers
 */
const STORAGE_KEY_AUTH_NAME = 'planning-poker-auth-name';
const STORAGE_KEY_AUTH_EMAIL = 'planning-poker-auth-email';
const STORAGE_KEY_AUTH_IS_ADMIN = 'planning-poker-auth-is-admin';

// Hardcoded admin credentials
const ADMIN_NAME = 'ohad';
const ADMIN_EMAIL = 'ohad.l@taboola.com';

export interface AuthUser {
  name: string;
  email: string;
  isAdmin: boolean;
}

export function isAdminUser(name: string, email: string): boolean {
  return name.toLowerCase() === ADMIN_NAME.toLowerCase() && 
         email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const name = localStorage.getItem(STORAGE_KEY_AUTH_NAME);
  const email = localStorage.getItem(STORAGE_KEY_AUTH_EMAIL);
  const isAdmin = localStorage.getItem(STORAGE_KEY_AUTH_IS_ADMIN) === 'true';
  
  if (!name || !email) {
    return null;
  }
  
  return { name, email, isAdmin };
}

export function setAuthUser(name: string, email: string): AuthUser {
  if (typeof window === 'undefined') {
    return { name, email, isAdmin: false };
  }
  
  const isAdmin = isAdminUser(name, email);
  
  localStorage.setItem(STORAGE_KEY_AUTH_NAME, name);
  localStorage.setItem(STORAGE_KEY_AUTH_EMAIL, email);
  localStorage.setItem(STORAGE_KEY_AUTH_IS_ADMIN, isAdmin.toString());
  
  return { name, email, isAdmin };
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY_AUTH_NAME);
  localStorage.removeItem(STORAGE_KEY_AUTH_EMAIL);
  localStorage.removeItem(STORAGE_KEY_AUTH_IS_ADMIN);
  
  // Also clear session data
  clearUserSession();
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return crypto.randomUUID();
}

/**
 * Format Jira/Confluence markup to clean readable text
 * Handles common Jira wiki markup syntax
 */
export function formatJiraMarkup(text: string): string {
  if (!text) return '';
  
  let formatted = text;
  
  // Remove color formatting: {color:#xxx}text{color} or {color:xxx}text{color}
  formatted = formatted.replace(/\{color[^}]*\}([\s\S]*?)\{color\}/gi, '$1');
  
  // Remove panel markup: {panel}text{panel}
  formatted = formatted.replace(/\{panel[^}]*\}([\s\S]*?)\{panel\}/gi, '$1');
  
  // Remove noformat: {noformat}text{noformat}
  formatted = formatted.replace(/\{noformat\}([\s\S]*?)\{noformat\}/gi, '$1');
  
  // Remove code blocks: {code}text{code}
  formatted = formatted.replace(/\{code[^}]*\}([\s\S]*?)\{code\}/gi, '$1');
  
  // Remove quote blocks: {quote}text{quote}
  formatted = formatted.replace(/\{quote\}([\s\S]*?)\{quote\}/gi, '"$1"');
  
  // Convert headers: h1. h2. h3. etc to just the text with line break
  formatted = formatted.replace(/^h[1-6]\.\s*/gm, '');
  
  // Convert bold: *text* to text (but not bullet points)
  formatted = formatted.replace(/\*([^*\n]+)\*/g, '$1');
  
  // Convert italic: _text_ to text
  formatted = formatted.replace(/_([^_\n]+)_/g, '$1');
  
  // Convert strikethrough: -text- to text
  formatted = formatted.replace(/-([^-\n]+)-/g, '$1');
  
  // Convert underline: +text+ to text
  formatted = formatted.replace(/\+([^+\n]+)\+/g, '$1');
  
  // Convert superscript: ^text^ to text
  formatted = formatted.replace(/\^([^^]+)\^/g, '$1');
  
  // Convert subscript: ~text~ to text
  formatted = formatted.replace(/~([^~]+)~/g, '$1');
  
  // Convert links: [text|url] or [url] to just the text/url
  formatted = formatted.replace(/\[([^|\]]+)\|([^\]]+)\]/g, '$1');
  formatted = formatted.replace(/\[([^\]]+)\]/g, '$1');
  
  // Remove image markup: !image.png! or !image.png|thumbnail!
  formatted = formatted.replace(/!([^|!\n]+)(\|[^!]*)?\!/g, '[Image: $1]');
  
  // Convert bullet points: * item or - item (at start of line)
  formatted = formatted.replace(/^[\*\-]\s+/gm, '• ');
  
  // Convert numbered lists: # item (at start of line)
  formatted = formatted.replace(/^#\s+/gm, '• ');
  
  // Remove anchor markup: {anchor:name}
  formatted = formatted.replace(/\{anchor:[^}]+\}/g, '');
  
  // Remove toc: {toc}
  formatted = formatted.replace(/\{toc[^}]*\}/gi, '');
  
  // Remove emoticons markup: (y) (n) (i) etc
  formatted = formatted.replace(/\([yni?x/!+\-*#]\)/g, '');
  
  // Remove multiple empty lines, replace with single
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  formatted = formatted.trim();
  
  return formatted;
}

/**
 * Export session summary to CSV
 */
export function exportSessionToCSV(summary: SessionSummary): void {
  // Create CSV content with parent info
  const headers = ['Parent Key', 'Parent Summary', 'Ticket Key', 'Summary', 'Votes', 'Average Vote', 'Agreed Points'];
  
  const rows = summary.tickets.map(ticket => {
    const votesStr = ticket.votes.map(v => `${v.oderName}:${v.value}`).join('; ');
    return [
      ticket.parentKey || '',
      ticket.parentSummary ? `"${ticket.parentSummary.replace(/"/g, '""')}"` : '',
      ticket.key,
      `"${ticket.summary.replace(/"/g, '""')}"`, // Escape quotes in summary
      `"${votesStr}"`,
      ticket.averageVote.toString(),
      ticket.agreedPoints?.toString() || '',
    ];
  });

  // Add summary row
  rows.push([]);
  rows.push(['--- SUMMARY ---', '', '', '', '', '', '']);
  rows.push(['Total Tickets', summary.totalTickets.toString(), '', '', '', '', '']);
  rows.push(['Estimated Tickets', summary.estimatedTickets.toString(), '', '', '', '', '']);
  rows.push(['Total Points', summary.totalPoints.toString(), '', '', '', '', '']);
  rows.push(['Average Points', summary.averagePoints.toString(), '', '', '', '', '']);
  rows.push(['Participants', `"${summary.participants.join(', ')}"`, '', '', '', '', '']);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `planning-poker-${summary.roomCode}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
