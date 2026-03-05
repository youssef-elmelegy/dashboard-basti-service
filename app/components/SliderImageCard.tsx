import { Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import type { SliderImage } from "@/lib/services/slider-image.service";

interface SliderImageCardProps {
  image: SliderImage;
  onEdit: (image: SliderImage) => void;
  onDelete: (image: SliderImage) => void;
}

export function SliderImageCard({
  image,
  onEdit,
  onDelete,
}: SliderImageCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* Image Container - Large and prominent */}
      <div className="relative w-full h-64 bg-muted/30 overflow-hidden flex-shrink-0">
        <img
          src={image.imageUrl}
          alt={image.title}
          className="w-full h-full object-cover"
        />
        {/* Action Menu */}
        <div className="absolute top-2 right-2 z-10">
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
              <DropdownMenuItem onClick={() => onEdit(image)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(image)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col gap-2 flex-grow">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground line-clamp-2">
            {image.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(image.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
