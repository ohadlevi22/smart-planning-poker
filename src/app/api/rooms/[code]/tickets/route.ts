import { NextRequest, NextResponse } from 'next/server';
import { addTickets } from '@/lib/store';
import { UploadTicketsRequest, ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/tickets - Upload tickets
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: UploadTicketsRequest = await request.json();

    if (!body.tickets || !Array.isArray(body.tickets) || body.tickets.length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Tickets array is required' },
        { status: 400 }
      );
    }

    const room = addTickets(code, body.tickets);

    if (!room) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Room>>({
      success: true,
      data: room,
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to upload tickets' },
      { status: 500 }
    );
  }
}

