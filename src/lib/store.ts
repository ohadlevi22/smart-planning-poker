import { Room, Ticket, Participant, Vote, RoomStatus, SessionSummary, TicketSummary } from '@/types';

// Check if we're in a Vercel environment with KV configured
const isKVConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Room TTL: 7 days (in seconds) - for KV
const ROOM_TTL = 60 * 60 * 24 * 7;

// In-memory fallback storage for local development
const localRooms = new Map<string, Room>();

// Dynamic import of @vercel/kv only when needed
let kvModule: typeof import('@vercel/kv') | null = null;

async function getKV() {
  if (!isKVConfigured) return null;
  if (!kvModule) {
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
  const kv = await getKV();
  if (kv) {
    return await kv.get<Room>(getRoomKey(code));
  }
  // Fallback to local storage
  return localRooms.get(code.toUpperCase()) || null;
}

async function saveRoom(room: Room): Promise<void> {
  const kv = await getKV();
  if (kv) {
    await kv.set(getRoomKey(room.code), room, { ex: ROOM_TTL });
  } else {
    // Fallback to local storage
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
    tickets: [],
    currentTicketIndex: 0,
    participants: [admin],
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  await saveRoom(room);
  return room;
}

export async function joinRoom(code: string, id: string, name: string): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;

  // Check if participant already exists
  const existingParticipant = room.participants.find(p => p.id === id);
  if (existingParticipant) {
    // Update name if changed
    existingParticipant.name = name;
  } else {
    const participant: Participant = {
      id,
      name,
      isAdmin: false,
    };
    room.participants.push(participant);
  }

  await saveRoom(room);
  return room;
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
