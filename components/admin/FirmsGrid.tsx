'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';

type FirmRow = {
  id: string;
  firm_name: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  firm_size: string | null;
  annual_returns_range: string | null;
  specializations: string | null;
  team_size_verified: string | null;
  team_page_url: string | null;
  specialty_verified: string | null;
  confidence_level: string | null;
  last_verified_on: string | null;
  created_at: string;
};

const columnHelper = createColumnHelper<FirmRow>();

export default function FirmsGrid() {
  const [data, setData] = useState<FirmRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'firm_name', desc: false }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page on search
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  useEffect(() => {
    fetchFirms();
  }, [debouncedSearch, sorting, pagination.pageIndex, pagination.pageSize]);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const sortStr = sorting.length > 0
        ? `${sorting[0].id}.${sorting[0].desc ? 'desc' : 'asc'}`
        : 'firm_name.asc';

      const params = new URLSearchParams({
        query: debouncedSearch,
        page: (pagination.pageIndex + 1).toString(),
        pageSize: pagination.pageSize.toString(),
        sort: sortStr,
      });

      const response = await fetch(`/api/admin/firms?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.rows);
        setTotal(result.total);
      } else {
        console.error('Failed to fetch firms');
      }
    } catch (error) {
      console.error('Error fetching firms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportVisible = () => {
    // Export visible data (client-side)
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
    ];

    const csvRows = [headers.join(',')];
    data.forEach(row => {
      const csvRow = [
        row.id,
        row.firm_name || '',
        row.website_url || '',
        row.linkedin_url || '',
        row.firm_size || '',
        row.annual_returns_range || '',
        row.specializations || '',
        row.team_size_verified || '',
        row.team_page_url || '',
        row.specialty_verified || '',
        row.confidence_level || '',
        row.last_verified_on || '',
      ].map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(csvRow.join(','));
    });

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firms-visible-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    try {
      const sortStr = sorting.length > 0
        ? `${sorting[0].id}.${sorting[0].desc ? 'desc' : 'asc'}`
        : 'firm_name.asc';

      const params = new URLSearchParams({
        query: debouncedSearch,
        sort: sortStr,
      });

      const response = await fetch(`/api/admin/firms/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `firms-all-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        console.error('Failed to export firms');
      }
    } catch (error) {
      console.error('Error exporting firms:', error);
    }
  };

  const handleEnrichment = async () => {
    setEnriching(true);
    setEnrichResult(null);

    try {
      const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);

      let body: any;
      if (selectedIds.length > 0) {
        // Enrich selected rows
        body = { ids: selectedIds };
      } else {
        // Enrich current filtered set
        body = {
          query: debouncedSearch,
          sort: sorting.length > 0 ? `${sorting[0].id}.${sorting[0].desc ? 'desc' : 'asc'}` : 'firm_name.asc',
        };
      }

      const response = await fetch('/api/admin/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        setEnrichResult(
          `✅ Enrichment complete!\n` +
          `• Attempted: ${result.attempted}\n` +
          `• Updated: ${result.updated}\n` +
          `• Skipped: ${result.skipped}\n` +
          `• Errors: ${result.errors.length}\n` +
          (result.errors.length > 0 ? `\nFirst errors:\n${result.errors.slice(0, 3).map((e: any) => `  - ${e.reason}`).join('\n')}` : '')
        );
        // Refresh data
        fetchFirms();
        setRowSelection({});
      } else {
        const error = await response.json();
        setEnrichResult(`❌ Error: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      setEnrichResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEnriching(false);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-slate-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-slate-300"
          />
        ),
        size: 40,
      }),
      columnHelper.accessor('firm_name', {
        header: 'Firm',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{info.getValue() || '—'}</span>
            {info.row.original.website_url && (
              <a
                href={info.row.original.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate max-w-xs"
              >
                {info.row.original.website_url}
              </a>
            )}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor('linkedin_url', {
        header: 'LinkedIn',
        cell: (info) =>
          info.getValue() ? (
            <a
              href={info.getValue() || ''}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm truncate max-w-[150px] block"
            >
              {info.getValue()?.replace('https://www.linkedin.com/in/', '@') || ''}
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          ),
        size: 150,
      }),
      columnHelper.accessor('firm_size', {
        header: 'Firm Size',
        cell: (info) => <span className="text-sm">{info.getValue() || '—'}</span>,
        size: 100,
      }),
      columnHelper.accessor('annual_returns_range', {
        header: 'Returns/Yr',
        cell: (info) => <span className="text-sm">{info.getValue() || '—'}</span>,
        size: 100,
      }),
      columnHelper.accessor('team_size_verified', {
        header: 'Team Size',
        cell: (info) => (
          <span className="text-sm font-medium text-emerald-600">
            {info.getValue() || '—'}
          </span>
        ),
        size: 100,
      }),
      columnHelper.accessor('specialty_verified', {
        header: 'Specialties Verified',
        cell: (info) => (
          <span className="text-xs text-slate-600 line-clamp-2">
            {info.getValue() || '—'}
          </span>
        ),
        size: 200,
      }),
      columnHelper.accessor('confidence_level', {
        header: 'Confidence',
        cell: (info) => {
          const level = info.getValue();
          if (!level) return <span className="text-slate-400">—</span>;
          
          const colors = {
            High: 'bg-emerald-100 text-emerald-700',
            Medium: 'bg-amber-100 text-amber-700',
            Low: 'bg-rose-100 text-rose-700',
          };
          
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level as keyof typeof colors] || 'bg-slate-100 text-slate-700'}`}>
              {level}
            </span>
          );
        },
        size: 100,
      }),
      columnHelper.accessor('team_page_url', {
        header: 'Team Page',
        cell: (info) =>
          info.getValue() ? (
            <a
              href={info.getValue() || ''}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs"
            >
              View
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          ),
        size: 80,
      }),
      columnHelper.accessor('last_verified_on', {
        header: 'Last Verified',
        cell: (info) => (
          <span className="text-xs text-slate-600">
            {info.getValue() ? new Date(info.getValue()!).toLocaleDateString() : '—'}
          </span>
        ),
        size: 110,
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    enableRowSelection: true,
  });

  const selectedCount = Object.keys(rowSelection).filter(k => rowSelection[k]).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search firms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportVisible}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Export Visible CSV
          </button>
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            Export ALL CSV
          </button>
          <button
            onClick={handleEnrichment}
            disabled={enriching}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {enriching ? 'Enriching...' : selectedCount > 0 ? `Enrich ${selectedCount} Selected` : 'Run Enrichment'}
          </button>
        </div>
      </div>

      {/* Enrichment Result */}
      {enrichResult && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm whitespace-pre-line">
          {enrichResult}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center gap-1' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-slate-400">
                              {{
                                asc: ' ↑',
                                desc: ' ↓',
                              }[header.column.getIsSorted() as string] ?? '↕'}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                    No firms found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of {total} rows
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

