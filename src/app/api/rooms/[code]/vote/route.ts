import { NextRequest, NextResponse } from 'next/server';
import { vote } from '@/lib/store';
import { VoteRequest, ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/vote - Submit a vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: VoteRequest = await request.json();

    if (!body.oderId || !body.oderName || typeof body.value !== 'number') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Voter ID, name, and value are required' },
        { status: 400 }
      );
    }

    const validValues = [2, 4, 8, 16];
    if (!validValues.includes(body.value)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Vote value must be 2, 4, 8, or 16' },
        { status: 400 }
      );
    }

    const room = await vote(code, body.oderId, body.oderName, body.value);

    if (!room) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room not found or cannot vote' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Room>>({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
