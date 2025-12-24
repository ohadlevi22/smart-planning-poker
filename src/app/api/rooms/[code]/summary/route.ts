import { NextRequest, NextResponse } from 'next/server';
import { getSessionSummary } from '@/lib/store';
import { ApiResponse, SessionSummary } from '@/types';

// GET /api/rooms/[code]/summary - Get session summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const summary = await getSessionSummary(code);

    if (!summary) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<SessionSummary>>({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get summary' },
      { status: 500 }
    );
  }
}

