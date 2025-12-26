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
    navigate(
      `/management/regions/${region.name.toLowerCase().replace(/\s+/g, "-")}`
    );
  };

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative min-h-40 flex items-center justify-center cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Action Menu */}
      <div
        className="absolute top-4 right-4"
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

      {/* Region Name */}
      <h3 className="text-2xl font-semibold text-card-foreground text-center">
        {region.name}
      </h3>
    </div>
  );
}
