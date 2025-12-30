import { NextRequest, NextResponse } from 'next/server';
import { setAgreedPoints } from '@/lib/store';
import { SetAgreedPointsRequest, ApiResponse, Room } from '@/types';

// POST /api/rooms/[code]/agree - Set agreed story points
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: SetAgreedPointsRequest = await request.json();

    if (typeof body.points !== 'number' || body.points < 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Valid points value is required' },
        { status: 400 }
      );
    }

    const room = await setAgreedPoints(code, body.points);

    if (!room) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room not found or ticket not revealed' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Room>>({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Error setting agreed points:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to set agreed points' },
      { status: 500 }
    );
  }
}


