import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReadyCake } from "@/data/products";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const TAG_COLORS: Record<string, string> = {
  birthday: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  anniversary: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  wedding:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  graduation:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  engagement:
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  custom: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

interface ReadyCakeCardProps {
  cake: ReadyCake;
  onEdit: (cake: ReadyCake) => void;
  onDelete: (cake: ReadyCake) => void;
  onToggleActive: (id: string) => void;
}

export function ReadyCakeCard({
  cake,
  onEdit,
  onDelete,
  onToggleActive,
}: ReadyCakeCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="relative w-full h-48 bg-muted overflow-hidden">
        <HoverCard>
          <HoverCardTrigger asChild>
            <img
              src={cake.image}
              alt={cake.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            />
          </HoverCardTrigger>
          <HoverCardContent side="right" className="w-auto p-2">
            <img
              src={cake.image}
              alt={cake.name}
              className="max-w-sm h-auto rounded-md"
            />
          </HoverCardContent>
        </HoverCard>
        {/* Action Menu */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-background/80 hover:bg-background"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(cake)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(cake)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-1">
            {cake.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cake.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {cake.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs ${TAG_COLORS[tag]}`}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Flavors */}
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Flavors
          </p>
          <div className="flex flex-wrap gap-1">
            {cake.flavors.map((flavor) => (
              <Badge key={flavor} variant="outline" className="text-xs">
                {flavor}
              </Badge>
            ))}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-border text-center">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Base Price
            </p>
            <p className="text-sm font-semibold text-card-foreground">
              ${cake.basePrice}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Capacity
            </p>
            <p className="text-sm font-semibold text-card-foreground">
              {cake.capacity}
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-auto py-1">
                <span className="text-xs">{cake.sizes.length} Sizes</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <p className="text-sm font-semibold mb-3">Available Sizes</p>
                {cake.sizes.map((size) => (
                  <div
                    key={size.name}
                    className="flex items-center justify-between p-2 border border-border rounded text-sm hover:bg-muted transition-colors"
                  >
                    <span>{size.name}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${size.price}
                    </span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Add to Cart Button */}
        <Button
          className="w-full gap-2"
          size="sm"
          variant={cake.isActive ? "default" : "outline"}
          onClick={() => onToggleActive(cake.id)}
        >
          {cake.isActive ? "✓ Active" : "○ Inactive"}
        </Button>
      </div>
    </div>
  );
}
