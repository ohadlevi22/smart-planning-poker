import { NextRequest, NextResponse } from 'next/server';
import { nextTicket } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/next - Go to next ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await nextTicket(code);

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
    console.error('Error going to next ticket:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to go to next ticket' },
      { status: 500 }
    );
  }
}
