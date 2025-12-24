import { Vote } from '@/types';

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
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return crypto.randomUUID();
}

