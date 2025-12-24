import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

// GET /api/rooms/[code] - Get room state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = getRoom(code);

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
      { success: false, error: 'Failed to get room' },
      { status: 500 }
    );
  }
}

