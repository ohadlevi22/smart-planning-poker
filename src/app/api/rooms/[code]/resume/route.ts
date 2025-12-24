import { NextRequest, NextResponse } from 'next/server';
import { resumeSession } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/resume - Resume session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await resumeSession(code);

    if (!room) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room not found or not paused' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Room>>({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Error resuming session:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to resume session' },
      { status: 500 }
    );
  }
}

