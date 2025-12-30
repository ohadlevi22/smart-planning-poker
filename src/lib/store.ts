import { Room, Ticket, Participant, Vote, RoomStatus, SessionSummary, TicketSummary, SavedReport, ReportTicket, ReportVote, ReportListItem } from '@/types';

// Room TTL: 7 days (in seconds) - for KV
const ROOM_TTL = 60 * 60 * 24 * 7;

// In-memory fallback storage for local development
const localRooms = new Map<string, Room>();

// Dynamic import of @vercel/kv only when needed
let kvModule: typeof import('@vercel/kv') | null = null;

// Check KV configuration at runtime (not module load time)
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKV() {
  // Check at runtime every time
  if (!isKVConfigured()) {
    console.log('[Store] KV not configured, using local storage');
    return null;
  }
  
  if (!kvModule) {
    console.log('[Store] Loading @vercel/kv module');
    kvModule = await import('@vercel/kv');
  }
  return kvModule.kv;
}

// Key prefix for rooms in KV store
const ROOM_KEY_PREFIX = 'room:';

// Generate a 6-character alphanumeric room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to get room key
function getRoomKey(code: string): string {
  return `${ROOM_KEY_PREFIX}${code.toUpperCase()}`;
}

export async function getRoom(code: string): Promise<Room | null> {
  const key = getRoomKey(code);
  const kv = await getKV();
  
  if (kv) {
    console.log(`[Store] Getting room from KV: ${key}`);
    const room = await kv.get<Room>(key);
    console.log(`[Store] Room found: ${room ? 'yes' : 'no'}`);
    return room;
  }
  
  // Fallback to local storage
  console.log(`[Store] Getting room from local storage: ${code.toUpperCase()}`);
  return localRooms.get(code.toUpperCase()) || null;
}

async function saveRoom(room: Room): Promise<void> {
  const key = getRoomKey(room.code);
  const kv = await getKV();
  
  if (kv) {
    console.log(`[Store] Saving room to KV: ${key}`);
    await kv.set(key, room, { ex: ROOM_TTL });
    console.log(`[Store] Room saved successfully`);
  } else {
    // Fallback to local storage
    console.log(`[Store] Saving room to local storage: ${room.code.toUpperCase()}`);
    localRooms.set(room.code.toUpperCase(), room);
  }
}

export async function createRoom(adminId: string, adminName: string): Promise<Room> {
  let code = generateRoomCode();
  
  // Ensure unique code
  let existingRoom = await getRoom(code);
  while (existingRoom) {
    code = generateRoomCode();
    existingRoom = await getRoom(code);
  }

  const admin: Participant = {
    id: adminId,
    name: adminName,
    isAdmin: true,
  };

  const room: Room = {
    code,
    adminId,
    adminName, // Store admin name for reconnection
    tickets: [],
    currentTicketIndex: 0,
    participants: [admin],
    status: 'active',
    planningStarted: false, // Will be set true after admin orders tickets
    createdAt: new Date().toISOString(),
  };

  await saveRoom(room);
  return room;
}

export interface JoinRoomResult {
  room: Room;
  oderId: string; // The participant's ID (may be different from input if reconnecting)
  isReconnect: boolean;
}

export interface JoinRoomError {
  type: 'room_not_found' | 'name_taken';
  message: string;
}

export async function joinRoom(code: string, id: string, name: string): Promise<JoinRoomResult | JoinRoomError> {
  const room = await getRoom(code);
  if (!room) {
    return { type: 'room_not_found', message: 'Room not found. It may have expired or the code is incorrect.' };
  }

  const normalizedName = name.trim().toLowerCase();
  
  // Check if a participant with the same name already exists (case-insensitive)
  const existingByName = room.participants.find(
    p => p.name.toLowerCase() === normalizedName
  );
  
  if (existingByName) {
    // Reconnect: return the existing participant's ID
    // Check if this is the admin reconnecting
    if (room.adminName.toLowerCase() === normalizedName) {
      existingByName.isAdmin = true;
      room.adminId = existingByName.id;
    }
    await saveRoom(room);
    return { room, oderId: existingByName.id, isReconnect: true };
  }
  
  // New participant - check if this is the admin name (they might have lost their session)
  const isAdmin = room.adminName.toLowerCase() === normalizedName;
  
  const participant: Participant = {
    id,
    name: name.trim(),
    isAdmin,
  };
  
  // If this is the admin reconnecting with a new ID, update adminId
  if (isAdmin) {
    room.adminId = id;
  }
  
  room.participants.push(participant);
  await saveRoom(room);
  return { room, oderId: id, isReconnect: false };
}

// Type guard for JoinRoomError
export function isJoinRoomError(result: JoinRoomResult | JoinRoomError): result is JoinRoomError {
  return 'type' in result && 'message' in result;
}

export async function addTickets(code: string, tickets: Omit<Ticket, 'votes' | 'isRevealed' | 'agreedPoints'>[]): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;

  room.tickets = tickets.map(t => ({
    ...t,
    votes: [],
    isRevealed: false,
    agreedPoints: undefined,
  }));
  room.currentTicketIndex = 0;
  room.status = 'active';

  await saveRoom(room);
  return room;
}

export async function vote(code: string, oderId: string, oderName: string, value: number): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.tickets.length === 0) return null;
  if (room.status !== 'active') return null;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (!currentTicket || currentTicket.isRevealed) return null;

  // Remove existing vote from this voter
  currentTicket.votes = currentTicket.votes.filter(v => v.oderId !== oderId);

  // Add new vote
  const newVote: Vote = {
    oderId,
    oderName,
    value,
  };
  currentTicket.votes.push(newVote);

  await saveRoom(room);
  return room;
}

export async function reveal(code: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.tickets.length === 0) return null;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (currentTicket) {
    currentTicket.isRevealed = true;
  }

  await saveRoom(room);
  return room;
}

export async function nextTicket(code: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;

  if (room.currentTicketIndex < room.tickets.length - 1) {
    room.currentTicketIndex++;
  }

  await saveRoom(room);
  return room;
}

export async function prevTicket(code: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;

  if (room.currentTicketIndex > 0) {
    room.currentTicketIndex--;
  }

  await saveRoom(room);
  return room;
}

export async function resetVotes(code: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.tickets.length === 0) return null;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (currentTicket) {
    currentTicket.votes = [];
    currentTicket.isRevealed = false;
    currentTicket.agreedPoints = undefined;
  }

  await saveRoom(room);
  return room;
}

// Set agreed story points for current ticket
export async function setAgreedPoints(code: string, points: number): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.tickets.length === 0) return null;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (!currentTicket || !currentTicket.isRevealed) return null;

  currentTicket.agreedPoints = points;

  await saveRoom(room);
  return room;
}

// Reorder tickets based on new order of ticket IDs
export async function reorderTickets(code: string, ticketIds: string[]): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.tickets.length === 0) return null;
  if (room.planningStarted) return null; // Can't reorder after planning started

  // Create a map of ticket id to ticket
  const ticketMap = new Map<string, typeof room.tickets[0]>();
  for (const ticket of room.tickets) {
    ticketMap.set(ticket.id, ticket);
  }

  // Reorder based on provided IDs
  const reorderedTickets: typeof room.tickets = [];
  for (const id of ticketIds) {
    const ticket = ticketMap.get(id);
    if (ticket) {
      reorderedTickets.push(ticket);
    }
  }

  // Make sure we didn't lose any tickets
  if (reorderedTickets.length !== room.tickets.length) {
    return null; // Invalid reorder request
  }

  room.tickets = reorderedTickets;
  await saveRoom(room);
  return room;
}

// Start planning session (after ordering tickets)
export async function startPlanning(code: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.tickets.length === 0) return null;
  if (room.planningStarted) return null; // Already started

  room.planningStarted = true;
  room.currentTicketIndex = 0;
  room.status = 'active';

  await saveRoom(room);
  return room;
}

// Pause session
export async function pauseSession(code: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.status === 'completed') return null;

  room.status = 'paused';
  room.pausedAt = new Date().toISOString();

  await saveRoom(room);
  return room;
}

// Resume session
export async function resumeSession(code: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.status !== 'paused') return null;

  room.status = 'active';
  room.pausedAt = undefined;

  await saveRoom(room);
  return room;
}

// End/Complete session
export async function endSession(code: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;

  room.status = 'completed';

  await saveRoom(room);
  return room;
}

// Get session summary
export async function getSessionSummary(code: string): Promise<SessionSummary | null> {
  const room = await getRoom(code);
  if (!room) return null;

  const ticketSummaries: TicketSummary[] = room.tickets.map(ticket => {
    const totalVotes = ticket.votes.reduce((sum, v) => sum + v.value, 0);
    const averageVote = ticket.votes.length > 0 ? totalVotes / ticket.votes.length : 0;
    
    return {
      key: ticket.key,
      summary: ticket.summary,
      parentKey: ticket.parentKey,
      parentSummary: ticket.parentSummary,
      agreedPoints: ticket.agreedPoints,
      votes: ticket.votes,
      averageVote: Math.round(averageVote * 10) / 10,
    };
  });

  const estimatedTickets = room.tickets.filter(t => t.agreedPoints !== undefined);
  const totalPoints = estimatedTickets.reduce((sum, t) => sum + (t.agreedPoints || 0), 0);

  const summary: SessionSummary = {
    roomCode: room.code,
    totalTickets: room.tickets.length,
    estimatedTickets: estimatedTickets.length,
    totalPoints,
    averagePoints: estimatedTickets.length > 0 ? Math.round((totalPoints / estimatedTickets.length) * 10) / 10 : 0,
    tickets: ticketSummaries,
    participants: room.participants.map(p => p.name),
    createdAt: room.createdAt,
    completedAt: room.status === 'completed' ? new Date().toISOString() : undefined,
  };

  return summary;
}

// Delete a room (optional cleanup)
export async function deleteRoom(code: string): Promise<void> {
  const kv = await getKV();
  if (kv) {
    await kv.del(getRoomKey(code));
  } else {
    localRooms.delete(code.toUpperCase());
  }
}

// ==================== REPORTS ====================

const REPORT_KEY_PREFIX = 'report:';
const REPORT_INDEX_KEY = 'reports:index';

// Report TTL: 365 days (in seconds)
const REPORT_TTL = 60 * 60 * 24 * 365;

// In-memory fallback storage for reports (local development)
const localReports = new Map<string, SavedReport>();
const localReportIndex: string[] = [];

function getReportKey(id: string): string {
  return `${REPORT_KEY_PREFIX}${id}`;
}

function generateReportId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Save a report from a room session
export async function saveReport(roomCode: string, reportName: string, adminName: string): Promise<SavedReport | null> {
  const room = await getRoom(roomCode);
  if (!room) return null;
  if (room.tickets.length === 0) return null;

  const reportId = generateReportId();

  // Convert tickets to report format
  const reportTickets: ReportTicket[] = room.tickets.map(ticket => {
    const totalVotes = ticket.votes.reduce((sum, v) => sum + v.value, 0);
    const averageVote = ticket.votes.length > 0 ? totalVotes / ticket.votes.length : 0;

    const votes: ReportVote[] = ticket.votes.map(v => ({
      participantName: v.oderName,
      value: v.value,
    }));

    return {
      key: ticket.key,
      summary: ticket.summary,
      assignee: ticket.assignee,
      parentKey: ticket.parentKey,
      parentSummary: ticket.parentSummary,
      agreedPoints: ticket.agreedPoints,
      averageVote: Math.round(averageVote * 10) / 10,
      votes,
    };
  });

  const estimatedTickets = room.tickets.filter(t => t.agreedPoints !== undefined);
  const totalPoints = estimatedTickets.reduce((sum, t) => sum + (t.agreedPoints || 0), 0);

  const report: SavedReport = {
    id: reportId,
    name: reportName.trim(),
    roomCode: room.code,
    createdAt: new Date().toISOString(),
    createdBy: adminName,
    totalTickets: room.tickets.length,
    estimatedTickets: estimatedTickets.length,
    totalPoints,
    averagePoints: estimatedTickets.length > 0 ? Math.round((totalPoints / estimatedTickets.length) * 10) / 10 : 0,
    participants: room.participants.map(p => p.name),
    tickets: reportTickets,
  };

  const kv = await getKV();
  if (kv) {
    // Save report
    await kv.set(getReportKey(reportId), report, { ex: REPORT_TTL });
    
    // Add to index
    const index = await kv.get<string[]>(REPORT_INDEX_KEY) || [];
    index.unshift(reportId); // Add to beginning (newest first)
    await kv.set(REPORT_INDEX_KEY, index, { ex: REPORT_TTL });
  } else {
    // Fallback to local storage
    localReports.set(reportId, report);
    localReportIndex.unshift(reportId);
  }

  return report;
}

// Get a single report by ID
export async function getReport(id: string): Promise<SavedReport | null> {
  const kv = await getKV();
  if (kv) {
    return await kv.get<SavedReport>(getReportKey(id));
  }
  return localReports.get(id) || null;
}

// Get all reports (list view)
export async function getAllReports(): Promise<ReportListItem[]> {
  const kv = await getKV();
  
  if (kv) {
    const index = await kv.get<string[]>(REPORT_INDEX_KEY) || [];
    const reports: ReportListItem[] = [];
    
    for (const id of index) {
      const report = await kv.get<SavedReport>(getReportKey(id));
      if (report) {
        reports.push({
          id: report.id,
          name: report.name,
          roomCode: report.roomCode,
          createdAt: report.createdAt,
          createdBy: report.createdBy,
          totalTickets: report.totalTickets,
          totalPoints: report.totalPoints,
        });
      }
    }
    
    return reports;
  }
  
  // Fallback to local storage
  return localReportIndex.map(id => {
    const report = localReports.get(id)!;
    return {
      id: report.id,
      name: report.name,
      roomCode: report.roomCode,
      createdAt: report.createdAt,
      createdBy: report.createdBy,
      totalTickets: report.totalTickets,
      totalPoints: report.totalPoints,
    };
  });
}

// Delete a report
export async function deleteReport(id: string): Promise<boolean> {
  const kv = await getKV();
  
  if (kv) {
    await kv.del(getReportKey(id));
    
    // Remove from index
    const index = await kv.get<string[]>(REPORT_INDEX_KEY) || [];
    const newIndex = index.filter(i => i !== id);
    await kv.set(REPORT_INDEX_KEY, newIndex, { ex: REPORT_TTL });
    
    return true;
  }
  
  // Fallback to local storage
  localReports.delete(id);
  const idx = localReportIndex.indexOf(id);
  if (idx > -1) {
    localReportIndex.splice(idx, 1);
  }
  
  return true;
}
