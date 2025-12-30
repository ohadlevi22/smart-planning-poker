export type RoomStatus = 'active' | 'paused' | 'completed';

export interface Room {
  code: string;
  adminId: string;
  adminName: string; // Store admin name for reconnection
  tickets: Ticket[];
  currentTicketIndex: number;
  participants: Participant[];
  status: RoomStatus;
  planningStarted: boolean; // Has admin started the planning session after ordering tickets?
  createdAt: string;
  pausedAt?: string;
}

export interface Ticket {
  id: string;
  key: string;
  summary: string;
  assignee?: string;
  description?: string;
  parentKey?: string;
  parentSummary?: string;
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

export interface ReorderTicketsRequest {
  ticketIds: string[]; // Array of ticket IDs in the new order
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
  parentKey?: string;
  parentSummary?: string;
  agreedPoints?: number;
  votes: Vote[];
  averageVote: number;
}

// Grouped tickets by parent for display
export interface TicketGroup {
  parentKey: string;
  parentSummary: string;
  tickets: Ticket[];
}

// Saved Reports for historical analysis
export interface SavedReport {
  id: string;
  name: string;
  roomCode: string;
  createdAt: string;
  createdBy: string; // Admin name who saved the report
  totalTickets: number;
  estimatedTickets: number;
  totalPoints: number;
  averagePoints: number;
  participants: string[];
  tickets: ReportTicket[];
}

export interface ReportTicket {
  key: string;
  summary: string;
  assignee?: string;
  parentKey?: string;
  parentSummary?: string;
  agreedPoints?: number;
  averageVote: number;
  votes: ReportVote[];
}

export interface ReportVote {
  participantName: string;
  value: number;
}

export interface ReportListItem {
  id: string;
  name: string;
  roomCode: string;
  createdAt: string;
  createdBy: string;
  totalTickets: number;
  totalPoints: number;
}

export interface SaveReportRequest {
  name: string;
  roomCode: string;
  adminName: string;
}
