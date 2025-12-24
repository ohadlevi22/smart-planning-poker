import { NextRequest, NextResponse } from 'next/server';
import { reveal } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/reveal - Reveal votes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await reveal(code);

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
    console.error('Error revealing votes:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to reveal votes' },
      { status: 500 }
    );
  }
}
