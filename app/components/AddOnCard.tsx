import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AddOn } from "@/data/products";
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

const CATEGORY_COLORS: Record<string, string> = {
  card: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  balloon: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  candle:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  decoration:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

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
  decoration:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  premium:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

interface AddOnCardProps {
  addOn: AddOn;
  onEdit: (addOn: AddOn) => void;
  onDelete: (addOn: AddOn) => void;
  onToggleActive: (id: string) => void;
}

export function AddOnCard({
  addOn,
  onEdit,
  onDelete,
  onToggleActive,
}: AddOnCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="relative w-full h-48 bg-muted overflow-hidden">
        <HoverCard>
          <HoverCardTrigger asChild>
            <img
              src={addOn.image}
              alt={addOn.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            />
          </HoverCardTrigger>
          <HoverCardContent side="right" className="w-auto p-2">
            <img
              src={addOn.image}
              alt={addOn.name}
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
              <DropdownMenuItem onClick={() => onEdit(addOn)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(addOn)}
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
            {addOn.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {addOn.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {addOn.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs ${TAG_COLORS[tag] || TAG_COLORS.custom}`}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Category */}
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Category
          </p>
          <div className="flex gap-1">
            <Badge
              variant="secondary"
              className={`text-xs ${CATEGORY_COLORS[addOn.category]}`}
            >
              {addOn.category.charAt(0).toUpperCase() + addOn.category.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Price */}
        <div className="py-3 border-t border-b border-border text-center">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Price
          </p>
          <p className="text-2xl font-semibold text-card-foreground">
            ${addOn.price.toFixed(2)}
          </p>
        </div>

        {/* Toggle Active Button */}
        <Button
          className="w-full gap-2"
          size="sm"
          variant={addOn.isActive ? "default" : "outline"}
          onClick={() => onToggleActive(addOn.id)}
        >
          {addOn.isActive ? "✓ Active" : "○ Inactive"}
        </Button>
      </div>
    </div>
  );
}
