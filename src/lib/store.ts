import { kv } from '@vercel/kv';
import { Room, Ticket, Participant, Vote } from '@/types';

// Key prefix for rooms in KV store
const ROOM_KEY_PREFIX = 'room:';

// Room TTL: 24 hours (in seconds)
const ROOM_TTL = 60 * 60 * 24;

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
  const room = await kv.get<Room>(getRoomKey(code));
  return room;
}

export async function createRoom(adminId: string, adminName: string): Promise<Room> {
  let code = generateRoomCode();
  
  // Ensure unique code
  let existingRoom = await kv.get(getRoomKey(code));
  while (existingRoom) {
    code = generateRoomCode();
    existingRoom = await kv.get(getRoomKey(code));
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
  };

  await kv.set(getRoomKey(code), room, { ex: ROOM_TTL });
  return room;
}

export async function joinRoom(code: string, id: string, name: string): Promise<Room | null> {
  const room = await kv.get<Room>(getRoomKey(code));
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

  await kv.set(getRoomKey(code), room, { ex: ROOM_TTL });
  return room;
}

export async function addTickets(code: string, tickets: Omit<Ticket, 'votes' | 'isRevealed'>[]): Promise<Room | null> {
  const room = await kv.get<Room>(getRoomKey(code));
  if (!room) return null;

  room.tickets = tickets.map(t => ({
    ...t,
    votes: [],
    isRevealed: false,
  }));
  room.currentTicketIndex = 0;

  await kv.set(getRoomKey(code), room, { ex: ROOM_TTL });
  return room;
}

export async function vote(code: string, oderId: string, oderName: string, value: number): Promise<Room | null> {
  const room = await kv.get<Room>(getRoomKey(code));
  if (!room) return null;
  if (room.tickets.length === 0) return null;

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

  await kv.set(getRoomKey(code), room, { ex: ROOM_TTL });
  return room;
}

export async function reveal(code: string): Promise<Room | null> {
  const room = await kv.get<Room>(getRoomKey(code));
  if (!room) return null;
  if (room.tickets.length === 0) return null;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (currentTicket) {
    currentTicket.isRevealed = true;
  }

  await kv.set(getRoomKey(code), room, { ex: ROOM_TTL });
  return room;
}

export async function nextTicket(code: string): Promise<Room | null> {
  const room = await kv.get<Room>(getRoomKey(code));
  if (!room) return null;

  if (room.currentTicketIndex < room.tickets.length - 1) {
    room.currentTicketIndex++;
  }

  await kv.set(getRoomKey(code), room, { ex: ROOM_TTL });
  return room;
}

export async function prevTicket(code: string): Promise<Room | null> {
  const room = await kv.get<Room>(getRoomKey(code));
  if (!room) return null;

  if (room.currentTicketIndex > 0) {
    room.currentTicketIndex--;
  }

  await kv.set(getRoomKey(code), room, { ex: ROOM_TTL });
  return room;
}

export async function resetVotes(code: string): Promise<Room | null> {
  const room = await kv.get<Room>(getRoomKey(code));
  if (!room) return null;
  if (room.tickets.length === 0) return null;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (currentTicket) {
    currentTicket.votes = [];
    currentTicket.isRevealed = false;
  }

  await kv.set(getRoomKey(code), room, { ex: ROOM_TTL });
  return room;
}

// Delete a room (optional cleanup)
export async function deleteRoom(code: string): Promise<void> {
  await kv.del(getRoomKey(code));
}
