import { NextRequest, NextResponse } from 'next/server';
import { resetVotes } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/reset - Reset current ticket votes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await resetVotes(code);

    if (!room) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room not found or no tickets' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Room>>({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Error resetting votes:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to reset votes' },
      { status: 500 }
    );
  }
}
