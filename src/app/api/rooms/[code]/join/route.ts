import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/store';
import { JoinRoomRequest, ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/join - Join a room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: JoinRoomRequest = await request.json();

    if (!body.id || !body.name || body.name.trim().length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    const room = await joinRoom(code, body.id, body.name.trim());

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
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
