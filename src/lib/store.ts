import { Room, Ticket, Participant, Vote } from '@/types';

// In-memory storage for MVP
const rooms = new Map<string, Room>();

// Generate a 6-character alphanumeric room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function createRoom(adminId: string, adminName: string): Room {
  let code = generateRoomCode();
  // Ensure unique code
  while (rooms.has(code)) {
    code = generateRoomCode();
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

  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, id: string, name: string): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;

  // Check if participant already exists
  const existingParticipant = room.participants.find(p => p.id === id);
  if (existingParticipant) {
    // Update name if changed
    existingParticipant.name = name;
    return room;
  }

  const participant: Participant = {
    id,
    name,
    isAdmin: false,
  };

  room.participants.push(participant);
  return room;
}

export function addTickets(code: string, tickets: Omit<Ticket, 'votes' | 'isRevealed'>[]): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;

  room.tickets = tickets.map(t => ({
    ...t,
    votes: [],
    isRevealed: false,
  }));
  room.currentTicketIndex = 0;

  return room;
}

export function vote(code: string, oderId: string, oderName: string, value: number): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;
  if (room.tickets.length === 0) return undefined;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (!currentTicket || currentTicket.isRevealed) return undefined;

  // Remove existing vote from this voter
  currentTicket.votes = currentTicket.votes.filter(v => v.oderId !== oderId);

  // Add new vote
  const newVote: Vote = {
    oderId,
    oderName,
    value,
  };
  currentTicket.votes.push(newVote);

  return room;
}

export function reveal(code: string): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;
  if (room.tickets.length === 0) return undefined;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (currentTicket) {
    currentTicket.isRevealed = true;
  }

  return room;
}

export function nextTicket(code: string): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;

  if (room.currentTicketIndex < room.tickets.length - 1) {
    room.currentTicketIndex++;
  }

  return room;
}

export function prevTicket(code: string): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;

  if (room.currentTicketIndex > 0) {
    room.currentTicketIndex--;
  }

  return room;
}

export function resetVotes(code: string): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;
  if (room.tickets.length === 0) return undefined;

  const currentTicket = room.tickets[room.currentTicketIndex];
  if (currentTicket) {
    currentTicket.votes = [];
    currentTicket.isRevealed = false;
  }

  return room;
}

// Helper to clean up old rooms (could be called periodically)
export function cleanupOldRooms(): void {
  // For MVP, we don't implement cleanup
  // In production, you'd track last activity and remove stale rooms
}

