import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Sweet } from "@/data/products";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface SweetCardProps {
  sweet: Sweet;
  onEdit: (sweet: Sweet) => void;
  onDelete: (sweet: Sweet) => void;
  onToggleActive: (id: string) => void;
}

export function SweetCard({
  sweet,
  onEdit,
  onDelete,
  onToggleActive,
}: SweetCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="relative w-full h-48 bg-muted overflow-hidden">
        <HoverCard>
          <HoverCardTrigger asChild>
            <img
              src={sweet.image}
              alt={sweet.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            />
          </HoverCardTrigger>
          <HoverCardContent side="right" className="w-auto p-2">
            <img
              src={sweet.image}
              alt={sweet.name}
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
              <DropdownMenuItem onClick={() => onEdit(sweet)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(sweet)}
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
            {sweet.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {sweet.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {sweet.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs ${TAG_COLORS[tag]}`}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Price</p>
            <p className="text-lg font-semibold text-card-foreground">
              ${sweet.price}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Capacity
            </p>
            <p className="text-lg font-semibold text-card-foreground">
              {sweet.capacity} servings
            </p>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          className="w-full gap-2"
          size="sm"
          variant={sweet.isActive ? "default" : "outline"}
          onClick={() => onToggleActive(sweet.id)}
        >
          {sweet.isActive ? "✓ Active" : "○ Inactive"}
        </Button>
      </div>
    </div>
  );
}
