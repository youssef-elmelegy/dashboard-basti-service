import { MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Shape } from "@/lib/services/shape.service";

interface ShapeCardProps {
  shape: Shape;
  onEdit: (shape: Shape) => void;
  onDelete: (shape: Shape) => void;
  onToggleFeatured: (id: string) => void;
}

export function ShapeCard({
  shape,
  onEdit,
  onDelete,
  onToggleFeatured,
}: ShapeCardProps) {
  const { t } = useTranslation();
  return (
    <div className="relative h-full rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-shadow">
      {shape.isFeatured && (
        <div
          className="absolute top-2 start-2 z-10 flex items-center justify-center rounded-full bg-background/85 p-1.5 shadow-sm"
          title={t("common.bestSeller")}
          aria-label={t("common.bestSeller")}
        >
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </div>
      )}
      <div className="flex gap-4">
        <img
          src={shape.shapeUrl}
          alt={shape.title}
          className="h-24 w-24 shrink-0 rounded-md object-contain"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold wrap-break-word">{shape.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 wrap-break-word">
            {shape.description}
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs capitalize">
              {t(`common.sizes.${shape.size}`, { defaultValue: shape.size })}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {t("customCakes.servingsCount", { count: shape.capacity })}
            </Badge>
            {shape.minPrepHours ? (
              <Badge variant="outline" className="text-xs">
                {t("customCakes.prepHours", { count: shape.minPrepHours })}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(shape.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleFeatured(shape.id)}>
              <Star className="h-4 w-4 me-2" />
              {t("common.toggleBestSeller")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(shape)}>
              <Pencil className="h-4 w-4 me-2" />
              {t("customCakes.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(shape)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 me-2" />
              {t("customCakes.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
