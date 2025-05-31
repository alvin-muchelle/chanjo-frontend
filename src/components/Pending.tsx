// src/components/Pending.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { ColumnResizer } from "./ColumnResizer";
import { calculateVaccinationSchedule } from "./CalculateSchedule";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isBefore, addDays } from "date-fns";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  VisibilityState,
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
import { Vaccination } from "./Columns";

// Base URL for API calls
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

interface PendingProps {
  columns: ColumnDef<Vaccination, unknown>[];
  data: Vaccination[];
  initialBirthDate?: string;
  babyId?: string;
  authToken: string;
}

export function Pending({
  columns: baseColumns,
  data,
  initialBirthDate,
  babyId,
  authToken,
}: PendingProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [adminLoading, setAdminLoading] = useState(true);

  // (1) Keep track of birthDate locally
  const [birthDate, setBirthDate] = useState<string>(initialBirthDate ?? "");
  useEffect(() => {
    setBirthDate(initialBirthDate ?? "");
  }, [initialBirthDate]);

  // (2) Turn birthDate → actual schedule
  const parsedBirthDate = useMemo(
    () => (birthDate ? new Date(birthDate) : null),
    [birthDate]
  );
  const fullSchedule = useMemo(
    () => (parsedBirthDate ? calculateVaccinationSchedule(data, parsedBirthDate) : []),
    [data, parsedBirthDate]
  );

  // (3) Compute “today” at midnight
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // (4) Fetch server‐side administered list on mount or babyId change
  const [serverAdministered, setServerAdministered] = useState<Vaccination[]>([]);
  useEffect(() => {
    if (!babyId || !authToken) return;

    setAdminLoading(true);

    fetch(`${API_BASE}/api/baby/${babyId}/administered`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((json: { administered: { vaccine: string; date: string }[] }) => {
        const mapped = json.administered.map((item) =>
          ({ vaccine: item.vaccine, date_to_be_administered: item.date } as Vaccination)
        );
        setServerAdministered(mapped);
      })
      .catch((err) => {
        console.error("Failed to load administered from server:", err);
      })
      .finally(() => {
        setAdminLoading(false);
      });
  }, [babyId, authToken]);

  // (5) Build administeredList by merging auto-past-due + serverAdministered
  const [administeredList, setAdministeredList] = useState<Vaccination[]>([]);
  useEffect(() => {
    const autoPast = fullSchedule.filter((item) => {
      if (!item.date_to_be_administered) return false;
      const d = new Date(item.date_to_be_administered + "T00:00:00Z");
      return d < today;
    });

    const keyOf = (v: Vaccination) => v.vaccine + "|" + v.date_to_be_administered;
    const map = new Map<string, Vaccination>();
    autoPast.forEach((v) => map.set(keyOf(v), v));
    serverAdministered.forEach((v) => map.set(keyOf(v), v));

    setAdministeredList(Array.from(map.values()));
  }, [fullSchedule, serverAdministered, today]);

  // (6) Build pendingSchedule
  const pendingSchedule = useMemo(() => {
    const administeredKeys = new Set(
      administeredList.map((v) => v.vaccine + "|" + v.date_to_be_administered)
    );
    return fullSchedule.filter((item) => {
      if (!item.date_to_be_administered) return false;
      const d = new Date(item.date_to_be_administered + "T00:00:00Z");
      return d >= today && !administeredKeys.has(item.vaccine + "|" + item.date_to_be_administered);
    });
  }, [fullSchedule, administeredList, today]);

  // (7) markAsAdministered
  const markAsAdministered = async (row: Vaccination) => {
    setAdministeredList((prev) => [...prev, row]);
    if (!babyId) return;
    try {
      await fetch(`${API_BASE}/api/baby/${babyId}/administered/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ vaccine: row.vaccine, date: row.date_to_be_administered, type: "manual" }),
      });
      setServerAdministered((prev) => [...prev, row]);
    } catch (err) {
      console.error("Failed to persist administered:", err);
    }
  };

  // (8) Administered column
  const administeredColumn = useMemo<ColumnDef<Vaccination, unknown>>(
    () => ({
      id: "administered",
      header: "Administered",
      cell: ({ row }) => {
        const original = row.original;
        const key = original.vaccine + "|" + original.date_to_be_administered;
        const already = administeredList.some((v) => key === v.vaccine + "|" + v.date_to_be_administered);
        const vaccDate = original.date_to_be_administered
          ? new Date(original.date_to_be_administered + "T00:00:00Z")
          : null;
        const tomorrow = addDays(today, 1);
        const isFuture = vaccDate ? !isBefore(vaccDate, tomorrow) : false;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <input
                  type="checkbox"
                  checked={already}
                  disabled={already || isFuture}
                  onChange={() => markAsAdministered(original)}
                  className="disabled:cursor-not-allowed h-4 w-4"
                />
              </div>
            </TooltipTrigger>
            {isFuture && <TooltipContent><span>Not allowed yet</span></TooltipContent>}
          </Tooltip>
        );
      },
      size: 30, minSize: 30, maxSize: 50,
    }),
    [administeredList, today, markAsAdministered]
  );

  // (9) Combine columns
  const allColumns = useMemo(() => [...baseColumns, administeredColumn], [baseColumns, administeredColumn]);

  // (10) Reset pagination
  useEffect(() => { setPagination((p) => ({ ...p, pageIndex: 0 })); }, [babyId]);

  // (11) Build table (always, but data is only shown after loading)
  const table = useReactTable({
    columns: allColumns,
    data: pendingSchedule,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    columnResizeMode: "onChange",
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
    autoResetPageIndex: false,
  });

  return (
    <div>
     (
        <>
          {/* Search bar */}
          <div className="flex items-center justify-between py-4 gap-4">
            <Input
              placeholder="Search for a vaccine"
              value={(table.getColumn("vaccine")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("vaccine")?.setFilterValue(e.target.value)}
              className="max-w-sm border-primary"
            />
          </div>

          {/* Table container */}
          <div className="w-full rounded-md border border-primary">
            <Table className="w-full">
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
                  table.getRowModel().rows.map((row, rowIndex, allRows) => {
                    const currentAge = row.getValue("age");
                    const prevAge = rowIndex > 0 ? allRows[rowIndex - 1].getValue("age") : null;
                    const isFirstOfAgeGroup = currentAge !== prevAge;

                    return (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => {
                          const isAgeCell = cell.column.id === "age";
                          const baseClasses = "truncate whitespace-nowrap overflow-hidden text-ellipsis px-2 py-1";
                          const borderClass = isAgeCell
                            ? isFirstOfAgeGroup
                              ? "border-t border-primary"
                              : "border-none"
                            : "border border-primary";

                          return (
                            <TableCell key={cell.id} className={`${baseClasses} ${borderClass}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={allColumns.length} className="h-24 text-center">
                      No upcoming vaccinations.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footnote & pagination */}
          <div className="mb-5">
            <div className="py-4 text-sm text-muted-foreground">
              <p><strong>* Rotavirus 3rd dose alternate schedule</strong></p>
              <p><strong>** Vitamin A is given every 6 months up to 5 years and during lactation</strong></p>
              <p><strong>*** One Dose Annually</strong></p>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next
              </Button>
            </div>
          </div>
        </>
      )
    </div>
  );
}
