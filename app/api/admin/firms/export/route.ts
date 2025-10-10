import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Check if user is admin
async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single();

  return { isAdmin: profile?.is_admin === true, userId };
}

// Escape CSV field
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/admin/firms/export - Export firms as CSV
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const sort = searchParams.get('sort') || 'firm_name.asc';

    // Parse sort param
    const [sortColumn, sortDirection] = sort.split('.');
    const validColumns = [
      'firm_name',
      'website_url',
      'linkedin_url',
      'firm_size',
      'annual_returns_range',
      'team_size_verified',
      'confidence_level',
      'last_verified_on',
      'created_at'
    ];
    const column = validColumns.includes(sortColumn) ? sortColumn : 'firm_name';
    const direction = sortDirection === 'desc' ? 'desc' : 'asc';

    const supabase = createServerClient();

    // Build query (no pagination for export)
    let queryBuilder = supabase
      .from('profiles')
      .select('id, firm_name, website_url, linkedin_url, firm_size, annual_returns_range, specializations, team_size_verified, team_page_url, specialty_verified, confidence_level, last_verified_on, created_at')
      .eq('is_deleted', false);

    // Apply search filter
    if (query) {
      queryBuilder = queryBuilder.or(
        `firm_name.ilike.%${query}%,website_url.ilike.%${query}%,linkedin_url.ilike.%${query}%,specialty_verified.ilike.%${query}%`
      );
    }

    // Apply sort
    queryBuilder = queryBuilder.order(column, { ascending: direction === 'asc' });

    const { data: rows, error } = await queryBuilder;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Build CSV
    const headers = [
      'ID',
      'Firm Name',
      'Website URL',
      'LinkedIn URL',
      'Firm Size',
      'Annual Returns Range',
      'Specializations',
      'Team Size Verified',
      'Team Page URL',
      'Specialty Verified',
      'Confidence Level',
      'Last Verified On',
      'Created At'
    ];

    const csvRows = [headers.join(',')];

    for (const row of rows || []) {
      const csvRow = [
        escapeCSV(row.id),
        escapeCSV(row.firm_name),
        escapeCSV(row.website_url),
        escapeCSV(row.linkedin_url),
        escapeCSV(row.firm_size),
        escapeCSV(row.annual_returns_range),
        escapeCSV(row.specializations),
        escapeCSV(row.team_size_verified),
        escapeCSV(row.team_page_url),
        escapeCSV(row.specialty_verified),
        escapeCSV(row.confidence_level),
        escapeCSV(row.last_verified_on),
        escapeCSV(row.created_at)
      ];
      csvRows.push(csvRow.join(','));
    }

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="firms-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting firms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

