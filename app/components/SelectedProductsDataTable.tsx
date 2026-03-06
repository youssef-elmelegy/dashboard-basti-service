import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useState } from "react";
import { DataTablePagination } from "@/components/TablePagination";
import type { SelectedProductItem } from "@/stores/regionProductSelectionStore";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

interface SelectedProductsDataTableProps {
  columns: ColumnDef<SelectedProductItem>[];
  data: SelectedProductItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

function SortIcon({ direction }: { direction?: "asc" | "desc" }) {
  if (direction === "asc") return <ChevronUp className="w-4 h-4 inline ml-1" />;
  if (direction === "desc")
    return <ChevronDown className="w-4 h-4 inline ml-1" />;
  return (
    <ChevronsUpDown className="w-4 h-4 inline ml-1 text-muted-foreground opacity-50" />
  );
}

export function SelectedProductsDataTable({
  columns,
  data,
  searchQuery = "",
  onSearchChange,
}: SelectedProductsDataTableProps) {
  const { t } = useTranslation();
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
    <div className="space-y-4">
      {/* Search Bar */}
      {onSearchChange && (
        <div className="flex items-center gap-2 bg-muted/50 p-4 rounded-lg border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-background border-0 focus-visible:ring-0"
          />
        </div>
      )}

      {/* Table */}
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
                          ? "cursor-pointer select-none hover:bg-muted transition whitespace-nowrap"
                          : "whitespace-nowrap"
                      }
                    >
                      <span className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
              table.getRowModel().rows.map((row) => {
                const productImage = row.original.productImage;
                const productName = row.original.productName;
                return (
                  <HoverCard key={row.id}>
                    <HoverCardTrigger asChild>
                      <TableRow data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto p-0 bg-transparent border-none shadow-lg rounded-lg overflow-hidden">
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-64 h-64 object-cover rounded-lg"
                      />
                    </HoverCardContent>
                  </HoverCard>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("regions.noProductsSelected")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
