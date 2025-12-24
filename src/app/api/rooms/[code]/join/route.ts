import { NextRequest, NextResponse } from 'next/server';
import { joinRoom, isJoinRoomError } from '@/lib/store';
import { JoinRoomRequest, ApiResponse, Room } from '@/types';

interface JoinRoomResponse {
  room: Room;
  oderId: string;
  isReconnect: boolean;
}

// POST /api/rooms/[code]/join - Join a room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: JoinRoomRequest = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    const id = body.id || crypto.randomUUID();
    const result = await joinRoom(code, id, body.name.trim());

    // Check if result is an error
    if (isJoinRoomError(result)) {
      const status = result.type === 'room_not_found' ? 404 : 409;
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: result.message },
        { status }
      );
    }

    return NextResponse.json<ApiResponse<JoinRoomResponse>>({
      success: true,
      data: {
        room: result.room,
        oderId: result.oderId,
        isReconnect: result.isReconnect,
      },
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
