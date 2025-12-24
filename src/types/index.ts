export type RoomStatus = 'active' | 'paused' | 'completed';

export interface Room {
  code: string;
  adminId: string;
  tickets: Ticket[];
  currentTicketIndex: number;
  participants: Participant[];
  status: RoomStatus;
  createdAt: string;
  pausedAt?: string;
}

export interface Ticket {
  id: string;
  key: string;
  summary: string;
  votes: Vote[];
  isRevealed: boolean;
  agreedPoints?: number;
}

export interface Participant {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface Vote {
  oderId: string;
  oderName: string;
  value: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateRoomRequest {
  adminName: string;
}

export interface JoinRoomRequest {
  id: string;
  name: string;
}

export interface VoteRequest {
  oderId: string;
  oderName: string;
  value: number;
}

export interface UploadTicketsRequest {
  tickets: Omit<Ticket, 'votes' | 'isRevealed' | 'agreedPoints'>[];
}

export interface SetAgreedPointsRequest {
  points: number;
}

export interface SessionSummary {
  roomCode: string;
  totalTickets: number;
  estimatedTickets: number;
  totalPoints: number;
  averagePoints: number;
  tickets: TicketSummary[];
  participants: string[];
  createdAt: string;
  completedAt?: string;
}

export interface TicketSummary {
  key: string;
  summary: string;
  agreedPoints?: number;
  votes: Vote[];
  averageVote: number;
}
