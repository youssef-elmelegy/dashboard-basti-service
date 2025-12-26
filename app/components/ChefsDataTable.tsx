import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { DataTablePagination } from "@/components/TablePagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function SortIcon({ direction }: { direction?: "asc" | "desc" }) {
  if (direction === "asc") return <ChevronUp className="w-4 h-4 inline ml-1" />;
  if (direction === "desc")
    return <ChevronDown className="w-4 h-4 inline ml-1" />;
  // faded icon for sortable columns
  return (
    <ChevronsUpDown className="w-4 h-4 inline ml-1 text-muted-foreground opacity-50" />
  );
}

export function ChefsDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSortable = header.column.getCanSort?.();
                const sorted = header.column.getIsSorted?.();
                return (
                  <TableHead
                    key={header.id}
                    onClick={
                      isSortable
                        ? () => {
                            // cycle: none -> asc -> desc -> none
                            if (!sorted)
                              header.column.toggleSorting(false); // asc
                            else if (sorted === "asc")
                              header.column.toggleSorting(true); // desc
                            else header.column.clearSorting(); // none
                          }
                        : undefined
                    }
                    className={
                      isSortable
                        ? "cursor-pointer select-none hover:bg-muted transition"
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {isSortable && (
                        <SortIcon
                          direction={sorted === false ? undefined : sorted}
                        />
                      )}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} />
    </div>
  );
}
