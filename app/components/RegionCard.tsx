import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { Region } from "@/data/regions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RegionCardProps {
  region: Region;
  onEdit: (region: Region) => void;
  onDelete: (region: Region) => void;
}

export function RegionCard({ region, onEdit, onDelete }: RegionCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/management/regions/${region.id}`);
  };

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer relative"
      onClick={handleCardClick}
    >
      {/* Action Menu */}
      <div
        className="absolute top-4 right-4 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(region)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(region)}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Region Image - Fixed Size Box */}
      {region.image && (
        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden rounded-t-lg">
          <img
            src={region.image}
            alt={region.name}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Content Footer - Name and Availability */}
      <div className="p-4 flex items-center justify-between gap-3">
        {/* Region Name */}
        <h3 className="text-lg font-semibold text-card-foreground flex-1">
          {region.name}
        </h3>

        {/* Availability Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap ${
            region.isAvailable
              ? "bg-[color:var(--color-chart-1)]"
              : "bg-[color:var(--color-destructive)]"
          }`}
        >
          {region.isAvailable ? "Available" : "Unavailable"}
        </div>
      </div>
    </div>
  );
}
