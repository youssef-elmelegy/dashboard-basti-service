import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ProductFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  activeFilter: "all" | "active" | "inactive";
  onActiveFilterChange: (filter: "all" | "active" | "inactive") => void;
}

export function ProductFilter({
  availableTags,
  selectedTags,
  onTagToggle,
  activeFilter,
  onActiveFilterChange,
}: ProductFilterProps) {
  const hasActiveFilters = selectedTags.length > 0 || activeFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        {/* Status Filter */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={activeFilter}
            onValueChange={(value) =>
              onActiveFilterChange(value as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags Filter */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onTagToggle(tag)}
              >
                {tag}
                {selectedTags.includes(tag) && <X className="w-3 h-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            selectedTags.forEach((tag) => onTagToggle(tag));
            onActiveFilterChange("all");
          }}
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {activeFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Status: {activeFilter}
              </Badge>
            )}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
