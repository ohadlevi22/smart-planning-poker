import { NextRequest, NextResponse } from 'next/server';
import { pauseSession } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/pause - Pause session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await pauseSession(code);

    if (!room) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room not found or already completed' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Room>>({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Error pausing session:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to pause session' },
      { status: 500 }
    );
  }
}

