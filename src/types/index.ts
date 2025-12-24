export interface Room {
  code: string;
  adminId: string;
  tickets: Ticket[];
  currentTicketIndex: number;
  participants: Participant[];
}

export interface Ticket {
  id: string;
  key: string;
  summary: string;
  votes: Vote[];
  isRevealed: boolean;
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
  tickets: Omit<Ticket, 'votes' | 'isRevealed'>[];
}

