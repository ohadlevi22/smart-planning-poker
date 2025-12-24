import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/store';
import { CreateRoomRequest, ApiResponse, Room } from '@/types';

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomRequest = await request.json();
    
    if (!body.adminName || body.adminName.trim().length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Admin name is required' },
        { status: 400 }
      );
    }

    const adminId = crypto.randomUUID();
    const room = await createRoom(adminId, body.adminName.trim());

    return NextResponse.json<ApiResponse<{ room: Room; adminId: string }>>({
      success: true,
      data: { room, adminId },
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
