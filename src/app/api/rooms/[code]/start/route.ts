import { NextRequest, NextResponse } from 'next/server';
import { startPlanning } from '@/lib/store';
import { ApiResponse, Room } from '@/types';

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Room>>> {
  try {
    const { code } = await context.params;
    
    const room = await startPlanning(code);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Failed to start planning' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: room });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

