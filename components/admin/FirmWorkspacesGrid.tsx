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
} from '@tanstack/react-table';

type FirmWorkspaceRow = {
  id: string;
  name: string;
  website: string | null;
  size_band: string | null;
  returns_band: string | null;
  verified: boolean;
  slug: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  subscription_current_period_end: string | null;
  trial_ends_at: string | null;
  created_at: string;
  member_count: number;
};

const columnHelper = createColumnHelper<FirmWorkspaceRow>();

export default function FirmWorkspacesGrid() {
  const [data, setData] = useState<FirmWorkspaceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

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
        : 'created_at.desc';

      const params = new URLSearchParams({
        query: debouncedSearch,
        page: (pagination.pageIndex + 1).toString(),
        pageSize: pagination.pageSize.toString(),
        sort: sortStr,
      });

      const response = await fetch(`/api/admin/firm-workspaces?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.rows);
        setTotal(result.total);
      } else {
        console.error('Failed to fetch firm workspaces');
      }
    } catch (error) {
      console.error('Error fetching firm workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (firmId: string, firmName: string) => {
    if (!confirm(`Are you sure you want to delete "${firmName}"? This will:\n\n• Remove the firm workspace\n• Remove all team members\n• Remove all trusted bench connections\n• Cancel any active subscriptions\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(firmId);
    
    try {
      const response = await fetch(`/api/admin/firm-workspaces/${firmId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setResult(`✅ Successfully deleted "${firmName}"`);
        // Refresh data
        fetchFirms();
      } else {
        const error = await response.json();
        setResult(`❌ Error deleting firm: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Firm Name',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{info.getValue()}</span>
            {info.row.original.slug && (
              <span className="text-xs text-slate-500">/{info.row.original.slug}</span>
            )}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor('website', {
        header: 'Website',
        cell: (info) =>
          info.getValue() ? (
            <a
              href={info.getValue() || ''}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm truncate max-w-[200px] block"
            >
              {info.getValue()}
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          ),
        size: 200,
      }),
      columnHelper.accessor('member_count', {
        header: 'Members',
        cell: (info) => (
          <span className="text-sm font-medium text-slate-900">
            {info.getValue()}
          </span>
        ),
        size: 80,
      }),
      columnHelper.accessor('size_band', {
        header: 'Size',
        cell: (info) => <span className="text-sm">{info.getValue() || '—'}</span>,
        size: 100,
      }),
      columnHelper.accessor('returns_band', {
        header: 'Returns',
        cell: (info) => <span className="text-sm">{info.getValue() || '—'}</span>,
        size: 100,
      }),
      columnHelper.accessor('subscription_status', {
        header: 'Subscription',
        cell: (info) => {
          const status = info.getValue();
          if (!status || status === 'inactive') return <span className="text-slate-400">—</span>;
          
          const colors = {
            active: 'bg-emerald-100 text-emerald-700',
            trialing: 'bg-blue-100 text-blue-700',
            past_due: 'bg-amber-100 text-amber-700',
            canceled: 'bg-rose-100 text-rose-700',
          };
          
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700'}`}>
              {status}
            </span>
          );
        },
        size: 120,
      }),
      columnHelper.accessor('verified', {
        header: 'Verified',
        cell: (info) => (
          info.getValue() 
            ? <span className="text-emerald-600">✓</span>
            : <span className="text-slate-400">—</span>
        ),
        size: 80,
      }),
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: (info) => (
          <span className="text-xs text-slate-600">
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
        size: 110,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => handleDelete(row.original.id, row.original.name)}
            disabled={deleting === row.original.id}
            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50"
          >
            {deleting === row.original.id ? 'Deleting...' : 'Delete'}
          </button>
        ),
        size: 100,
      }),
    ],
    [deleting]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pagination.pageSize),
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search firm workspaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <div className="text-sm text-slate-600">
          {total} {total === 1 ? 'workspace' : 'workspaces'}
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm whitespace-pre-line">
          {result}
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
                    No firm workspaces found
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

