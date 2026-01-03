import { Users, Package, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { Bakery, BakeryType } from "@/data/bakeries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const BAKERY_TYPE_CONFIG: Record<
  BakeryType,
  {
    label: string;
    color: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  basket_cakes: { label: "Basket Cakes", color: "default" },
  midume: { label: "Midume", color: "secondary" },
  small_cakes: { label: "Small Cakes", color: "outline" },
  large_cakes: { label: "Large Cakes", color: "destructive" },
  custom: { label: "Custom", color: "default" },
};

interface BakeryCardProps {
  bakery: Bakery;
  onEdit: (bakery: Bakery) => void;
  onDelete: (bakery: Bakery) => void;
}

export function BakeryCard({ bakery, onEdit, onDelete }: BakeryCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown menu
    if ((e.target as HTMLElement).closest('[role="button"]')) {
      return;
    }
    navigate(`/management/bakeries/${bakery.id}`);
  };

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Action Menu */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(bakery)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(bakery)}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header */}
      <div className="mb-4 pr-12">
        <h3 className="text-lg font-semibold text-card-foreground mb-1">
          {bakery.name}
        </h3>
        <p className="text-sm text-muted-foreground">{bakery.location}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
        <div className="flex items-start gap-2">
          <Package className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Capacity
            </p>
            <p className="text-lg font-semibold text-card-foreground">
              {bakery.capacity}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Employees
            </p>
            <p className="text-lg font-semibold text-card-foreground">
              {bakery.employees}
            </p>
          </div>
        </div>
      </div>

      {/* Region Tag */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground font-medium mb-2">
          Regions
        </p>
        <div className="flex flex-wrap gap-2">
          {bakery.regions.map((region) => (
            <Badge key={region} variant="outline">
              {region}
            </Badge>
          ))}
        </div>
      </div>

      {/* Types */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">Types</p>
        <div className="flex flex-wrap gap-2">
          {bakery.types.map((type: BakeryType) => (
            <Badge
              key={type}
              variant={BAKERY_TYPE_CONFIG[type].color}
              className={`text-xs ${
                type === "custom"
                  ? "bg-[oklch(87.79%_0.23094_129.081)] text-white dark:bg-[oklch(87.79%_0.23094_129.081/0.672)] dark:text-white"
                  : ""
              }`}
            >
              {BAKERY_TYPE_CONFIG[type].label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
