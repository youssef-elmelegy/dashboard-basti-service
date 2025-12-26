import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type Chef = {
  id: string;
  name: string;
  image: string;
  bakery: string;
  rating: number;
};

export const columns = (
  onEdit?: (chef: Chef) => void,
  onDelete?: (chef: Chef) => void
): ColumnDef<Chef>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Chef",
    enableSorting: false,
    cell: ({ row }) => {
      const chef = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={chef.image} alt={chef.name} />
            <AvatarFallback>{chef.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{chef.name}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "bakery",
    header: "Bakery",
    enableSorting: false,
  },
  {
    accessorKey: "rating",
    enableSorting: true,
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          type="button"
          onClick={() => {
            // cycle: none -> asc -> desc -> none
            if (!sorted) column.toggleSorting(false); // asc
            else if (sorted === "asc") column.toggleSorting(true); // desc
            else column.clearSorting(); // none
          }}
          className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded cursor-pointer select-none"
        >
          Rating
        </button>
      );
    },
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number;
      return (
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          <span>{rating.toFixed(1)}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="sticky right-0 ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit?.(row.original)}>
                Edit Chef
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(row.original)}
                className="text-red-600"
              >
                Delete Chef
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
