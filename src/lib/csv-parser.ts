import { Ticket, TicketGroup } from '@/types';

/**
 * Parse Jira CSV export format
 * Expected columns: Issue Type, Issue key, Issue id, Summary, Assignee, Assignee Id, Priority, Status, Description, Parent, Parent key, Parent summary
 */
export function parseJiraCSV(content: string): Omit<Ticket, 'votes' | 'isRevealed' | 'agreedPoints'>[] {
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  // Parse header to find column indices
  const header = parseCSVLine(lines[0]);
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

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
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
 * Parse a single CSV line, handling quoted fields with commas and newlines inside
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
