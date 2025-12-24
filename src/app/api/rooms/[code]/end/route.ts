import { NextRequest, NextResponse } from 'next/server';
import { endSession } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/end - End session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await endSession(code);

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
    console.error('Error ending session:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

