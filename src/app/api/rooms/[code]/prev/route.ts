import { NextRequest, NextResponse } from 'next/server';
import { prevTicket } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/prev - Go to previous ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = prevTicket(code);

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
      { success: false, error: 'Failed to go to previous ticket' },
      { status: 500 }
    );
  }
}

