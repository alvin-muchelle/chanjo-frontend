"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ColumnResizer } from "./ColumnResizer";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_BACKEND_URL;

// Each “administered” entry is expected to look like:
// { vaccine: string, date: string }
interface AdministeredEntry {
  vaccine: string;
  date: string;
}

interface AdministeredProps {
  babyId: string;
  authToken: string;
}

export function Administered({ babyId, authToken }: AdministeredProps) {
  // (A) Local state for the fetched “administered” list
  const [data, setData] = useState<AdministeredEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // (B) Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  // (C) Fetch “administered” list whenever babyId or authToken changes
  useEffect(() => {
    if (!babyId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/baby/${babyId}/administered`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load administered list");
        return res.json();
      })
      .then((json: { administered: AdministeredEntry[] }) => {
        setData(json.administered || []);
      })
      .catch((err) => {
        console.error("Error fetching administered:", err);
        toast.error("Failed to load administered list");
      })
      .finally(() => setLoading(false));
  }, [babyId, authToken]);

  // (D) Define columns for the table
  const columns: ColumnDef<AdministeredEntry>[] = React.useMemo(
    () => [
      {
        accessorKey: "vaccine",
        header: "Vaccine",
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: "date",
        header: "Date Administered",
        cell: (info) => {
          // Format “YYYY-MM-DDT...” to local date string
          const raw = info.getValue() as string;
          const d = new Date(raw);
          return <span>{isNaN(d.getTime()) ? raw : d.toLocaleDateString()}</span>;
        },
      },
    ],
    []
  );

  // (E) Build the table instance
  const table = useReactTable({
    columns,
    data,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    columnResizeMode: "onChange",
    autoResetPageIndex: false,
  });

  if (loading) {
    return <p>Loading administered list…</p>;
  }

  return (
    <div>
      {/* Search bar: filter by vaccine name */}
      <div className="flex items-center justify-between py-4 gap-4">
        <input
          type="text"
          placeholder="Search for a vaccine"
          value={(table.getColumn("vaccine")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("vaccine")?.setFilterValue(e.target.value)}
          className="max-w-sm border border-primary px-2 py-1 rounded"
        />
      </div>

      {/* Table container */}
      <div className="overflow-x-auto w-full rounded-md border border-primary">
        <Table className="min-w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative border border-primary px-2 py-1 truncate whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    <ColumnResizer header={header} />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="truncate whitespace-nowrap overflow-hidden text-ellipsis border border-primary px-2 py-1"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No administered vaccinations to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
