import { NextRequest, NextResponse } from 'next/server';
import { getReport, deleteReport } from '@/lib/store';
import { ApiResponse, SavedReport } from '@/types';

// GET /api/reports/[id] - Get a single report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await getReport(id);

    if (!report) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<SavedReport>>({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error getting report:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteReport(id);

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}


