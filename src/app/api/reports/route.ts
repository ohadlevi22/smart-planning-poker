import { NextRequest, NextResponse } from 'next/server';
import { saveReport, getAllReports } from '@/lib/store';
import { ApiResponse, SavedReport, ReportListItem, SaveReportRequest } from '@/types';

// GET /api/reports - Get all reports
export async function GET() {
  try {
    const reports = await getAllReports();
    
    return NextResponse.json<ApiResponse<ReportListItem[]>>({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to get reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Save a new report
export async function POST(request: NextRequest) {
  try {
    const body: SaveReportRequest = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Report name is required' },
        { status: 400 }
      );
    }

    if (!body.roomCode) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room code is required' },
        { status: 400 }
      );
    }

    const report = await saveReport(body.roomCode, body.name, body.adminName || 'Admin');

    if (!report) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Room not found or has no tickets' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<SavedReport>>({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to save report' },
      { status: 500 }
    );
  }
}


