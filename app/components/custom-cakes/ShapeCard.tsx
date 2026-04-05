import { MoreVertical, Pencil, Trash2 } from "lucide-react";
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
}

export function ShapeCard({ shape, onEdit, onDelete }: ShapeCardProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        <img
          src={shape.shapeUrl}
          alt={shape.title}
          className="h-24 w-24 rounded-md object-contain"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{shape.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {shape.description}
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs capitalize">
              {shape.size}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {shape.capacity} servings
            </Badge>
            {shape.minPrepHours && (
              <Badge variant="outline" className="text-xs">
                {shape.minPrepHours}h prep
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(shape.createdAt).toLocaleDateString()}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(shape)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("customCakes.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(shape)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("customCakes.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
