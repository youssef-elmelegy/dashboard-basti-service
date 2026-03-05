import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { SelectedProductItem } from "@/stores/regionProductSelectionStore";

export const selectedProductsColumns = (
  onRemove: (id: string) => void,
  onEdit: (item: SelectedProductItem) => void,
): ColumnDef<SelectedProductItem>[] => [
  {
    accessorKey: "productImage",
    header: "Image",
    size: 60,
    enableSorting: false,
    cell: ({ row }) => (
      <img
        src={row.original.productImage}
        alt={row.original.productName}
        className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
      />
    ),
  },
  {
    accessorKey: "productName",
    header: "Product Name",
    size: 200,
    enableSorting: false,
    cell: ({ row }) => {
      const productType = row.original.productType || row.original.type;
      const typeLabels: Record<string, string> = {
        "featured-cake": "Featured Cake",
        addon: "Add-on",
        sweet: "Sweet",
        flavor: "Flavor",
        shape: "Shape",
        decoration: "Decoration",
        "predesigned-cake": "Predesigned Cake",
        cake: "Cake",
      };
      const typeLabel = typeLabels[productType] || productType;

      return (
        <div>
          <p className="font-semibold">{row.original.productName}</p>
          <Badge variant="outline" className="mt-1">
            {typeLabel}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "selectedSizes",
    header: "Sizes",
    size: 250,
    enableSorting: false,
    cell: ({ row }) => {
      const sizes = row.original.selectedSizes;
      if (sizes && sizes.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Badge key={size.name} variant="secondary" className="text-xs">
                {size.name} - ${size.price}
              </Badge>
            ))}
          </div>
        );
      }
      return <span className="text-muted-foreground">Standard</span>;
    },
  },
  {
    accessorKey: "basePrice",
    enableSorting: true,
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          type="button"
          onClick={() => {
            // cycle: none -> asc -> desc -> none
            if (!sorted)
              column.toggleSorting(false); // asc
            else if (sorted === "asc")
              column.toggleSorting(true); // desc
            else column.clearSorting(); // none
          }}
          className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded cursor-pointer select-none"
        >
          Price
        </button>
      );
    },
    size: 100,
    cell: ({ row }) => `$${(row.original.basePrice ?? 0).toFixed(2)}`,
  },
  {
    id: "actions",
    header: "Actions",
    size: 80,
    enableSorting: false,
    cell: ({ row }: { row: { original: SelectedProductItem } }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              if (typeof onEdit === "function") onEdit(row.original);
            }}
          >
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (typeof onRemove === "function") onRemove(row.original.id);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
