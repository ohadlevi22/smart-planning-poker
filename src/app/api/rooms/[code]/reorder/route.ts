import { NextRequest, NextResponse } from 'next/server';
import { reorderTickets } from '@/lib/store';
import { ReorderTicketsRequest, ApiResponse, Room } from '@/types';

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Room>>> {
  try {
    const { code } = await context.params;
    const { ticketIds }: ReorderTicketsRequest = await request.json();

    if (!ticketIds || !Array.isArray(ticketIds)) {
      return NextResponse.json({ success: false, error: 'Ticket IDs array is required' }, { status: 400 });
    }

    const room = await reorderTickets(code, ticketIds);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Failed to reorder tickets' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: room });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

