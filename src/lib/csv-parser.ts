import { Ticket } from '@/types';

/**
 * Parse Jira CSV export format
 * Expected columns: Issue Type, Issue key, Issue id, Summary, Assignee, Assignee Id, Priority, Status
 * We extract: Issue key and Summary
 */
export function parseJiraCSV(content: string): Omit<Ticket, 'votes' | 'isRevealed'>[] {
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  // Parse header to find column indices
  const header = parseCSVLine(lines[0]);
  const keyIndex = header.findIndex(h => h.toLowerCase().includes('issue key'));
  const summaryIndex = header.findIndex(h => h.toLowerCase() === 'summary');
  const idIndex = header.findIndex(h => h.toLowerCase().includes('issue id'));

  if (keyIndex === -1 || summaryIndex === -1) {
    throw new Error('CSV must contain "Issue key" and "Summary" columns');
  }

  const tickets: Omit<Ticket, 'votes' | 'isRevealed'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    const key = fields[keyIndex]?.trim();
    const summary = fields[summaryIndex]?.trim();
    const id = idIndex !== -1 ? fields[idIndex]?.trim() : crypto.randomUUID();

    if (key && summary) {
      tickets.push({
        id: id || crypto.randomUUID(),
        key,
        summary,
      });
    }
  }

  return tickets;
}

/**
 * Parse a single CSV line, handling quoted fields with commas inside
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  // Don't forget the last field
  fields.push(current);

  return fields;
}

/**
 * Validate that content looks like a valid Jira CSV
 */
export function validateJiraCSV(content: string): { valid: boolean; error?: string } {
  try {
    const lines = content.split('\n');
    if (lines.length < 2) {
      return { valid: false, error: 'CSV must have at least a header and one data row' };
    }

    const header = parseCSVLine(lines[0]);
    const hasKey = header.some(h => h.toLowerCase().includes('issue key'));
    const hasSummary = header.some(h => h.toLowerCase() === 'summary');

    if (!hasKey) {
      return { valid: false, error: 'CSV must contain an "Issue key" column' };
    }
    if (!hasSummary) {
      return { valid: false, error: 'CSV must contain a "Summary" column' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Failed to parse CSV' };
  }
}

