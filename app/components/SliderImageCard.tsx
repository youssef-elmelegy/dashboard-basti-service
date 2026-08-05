import { Trash2, Pencil, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* Image Container - Large and prominent */}
      <div className="relative w-full h-64 bg-muted/30 overflow-hidden flex-shrink-0">
        <img
          src={image.imageUrl}
          alt={image.title}
          className={cn(
            "w-full h-full object-cover",
            // Dimmed to signal the image is not being served to customers
            image.isHidden && "opacity-40 grayscale",
          )}
        />
        {image.isHidden && (
          <div className="absolute top-2 start-2 z-10">
            <Badge
              variant="secondary"
              className="gap-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
            >
              <EyeOff className="w-3 h-3" />
              {t("sliderImages.hidden")}
            </Badge>
          </div>
        )}
        {/* Action Menu */}
        <div className="absolute top-2 end-2 z-10">
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
                <Pencil className="h-4 w-4 me-2" />
                {t("sliderImages.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(image)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 me-2" />
                {t("sliderImages.delete")}
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
            {new Date(image.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        {image.isHidden && (
          <p className="text-xs rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
            {t("sliderImages.hiddenReason")}
          </p>
        )}
      </div>
    </div>
  );
}
