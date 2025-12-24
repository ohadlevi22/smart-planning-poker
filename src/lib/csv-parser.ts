import { Ticket, TicketGroup } from '@/types';

/**
 * Parse Jira CSV export format
 * Expected columns: Issue Type, Issue key, Issue id, Summary, Assignee, Assignee Id, Priority, Status, Description, Parent, Parent key, Parent summary
 * 
 * Handles:
 * - Commas inside quoted fields
 * - Multi-line descriptions in quoted fields
 * - Escaped quotes ("") inside fields
 */
export function parseJiraCSV(content: string): Omit<Ticket, 'votes' | 'isRevealed' | 'agreedPoints'>[] {
  // Parse entire CSV handling multi-line quoted fields
  const records = parseCSVContent(content);
  
  if (records.length < 2) return [];

  // Parse header to find column indices
  const header = records[0];
  const keyIndex = header.findIndex(h => h.toLowerCase().includes('issue key'));
  const summaryIndex = header.findIndex(h => h.toLowerCase() === 'summary');
  const idIndex = header.findIndex(h => h.toLowerCase().includes('issue id'));
  const assigneeIndex = header.findIndex(h => h.toLowerCase() === 'assignee');
  const descriptionIndex = header.findIndex(h => h.toLowerCase() === 'description');
  const parentKeyIndex = header.findIndex(h => h.toLowerCase() === 'parent key');
  const parentSummaryIndex = header.findIndex(h => h.toLowerCase() === 'parent summary');

  if (keyIndex === -1 || summaryIndex === -1) {
    throw new Error('CSV must contain "Issue key" and "Summary" columns');
  }

  const tickets: Omit<Ticket, 'votes' | 'isRevealed' | 'agreedPoints'>[] = [];

  for (let i = 1; i < records.length; i++) {
    const fields = records[i];
    
    const key = fields[keyIndex]?.trim();
    const summary = fields[summaryIndex]?.trim();
    const id = idIndex !== -1 ? fields[idIndex]?.trim() : crypto.randomUUID();
    const assignee = assigneeIndex !== -1 ? fields[assigneeIndex]?.trim() : undefined;
    const description = descriptionIndex !== -1 ? fields[descriptionIndex]?.trim() : undefined;
    const parentKey = parentKeyIndex !== -1 ? fields[parentKeyIndex]?.trim() : undefined;
    const parentSummary = parentSummaryIndex !== -1 ? fields[parentSummaryIndex]?.trim() : undefined;

    if (key && summary) {
      tickets.push({
        id: id || crypto.randomUUID(),
        key,
        summary,
        assignee: assignee || undefined,
        description: description || undefined,
        parentKey: parentKey || undefined,
        parentSummary: parentSummary || undefined,
      });
    }
  }

  return tickets;
}

/**
 * Parse CSV content handling multi-line quoted fields
 * Returns array of records, where each record is an array of field values
 */
function parseCSVContent(content: string): string[][] {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalizedContent.length; i++) {
    const char = normalizedContent[i];
    const nextChar = normalizedContent[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote - add single quote and skip next
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        // Any character inside quotes (including newlines and commas)
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        currentRecord.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        // End of record (only when not in quotes)
        currentRecord.push(currentField);
        if (currentRecord.some(f => f.trim())) { // Only add non-empty records
          records.push(currentRecord);
        }
        currentRecord = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  // Don't forget the last field and record
  currentRecord.push(currentField);
  if (currentRecord.some(f => f.trim())) {
    records.push(currentRecord);
  }
  
  return records;
}

/**
 * Group tickets by their parent for organized display
 */
export function groupTicketsByParent(tickets: Ticket[]): TicketGroup[] {
  const groups = new Map<string, TicketGroup>();
  const noParentKey = '__no_parent__';

  for (const ticket of tickets) {
    const key = ticket.parentKey || noParentKey;
    
    if (!groups.has(key)) {
      groups.set(key, {
        parentKey: ticket.parentKey || '',
        parentSummary: ticket.parentSummary || 'Ungrouped',
        tickets: [],
      });
    }
    
    groups.get(key)!.tickets.push(ticket);
  }

  // Convert to array and sort: grouped tickets first, then ungrouped
  const result = Array.from(groups.values());
  result.sort((a, b) => {
    if (a.parentKey === '' && b.parentKey !== '') return 1;
    if (a.parentKey !== '' && b.parentKey === '') return -1;
    return a.parentSummary.localeCompare(b.parentSummary);
  });

  return result;
}

/**
 * Reorder tickets by parent groups (flattened for sequential voting)
 */
export function orderTicketsByParent(tickets: Omit<Ticket, 'votes' | 'isRevealed' | 'agreedPoints'>[]): Omit<Ticket, 'votes' | 'isRevealed' | 'agreedPoints'>[] {
  // Create temporary tickets with votes/isRevealed for grouping
  const fullTickets = tickets.map(t => ({
    ...t,
    votes: [],
    isRevealed: false,
  })) as Ticket[];

  const groups = groupTicketsByParent(fullTickets);
  
  // Flatten groups back to ordered array
  return groups.flatMap(g => g.tickets.map(t => ({
    id: t.id,
    key: t.key,
    summary: t.summary,
    assignee: t.assignee,
    description: t.description,
    parentKey: t.parentKey,
    parentSummary: t.parentSummary,
  })));
}

/**
 * Validate that content looks like a valid Jira CSV
 */
export function validateJiraCSV(content: string): { valid: boolean; error?: string } {
  try {
    const records = parseCSVContent(content);
    
    if (records.length < 2) {
      return { valid: false, error: 'CSV must have at least a header and one data row' };
    }

    const header = records[0];
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
