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
import type { Decoration } from "@/lib/services/decoration.service";

interface DecorationCardProps {
  decoration: Decoration;
  onEdit: (decoration: Decoration) => void;
  onDelete: (decoration: Decoration) => void;
  onToggleFeatured: (id: string) => void;
}

export function DecorationCard({
  decoration,
  onEdit,
  onDelete,
  onToggleFeatured,
}: DecorationCardProps) {
  const { t } = useTranslation();
  return (
    <div className="relative rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-shadow">
      {decoration.isFeatured && (
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
          src={decoration.decorationUrl}
          alt={decoration.title}
          className="h-24 w-24 rounded-md object-contain"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{decoration.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {decoration.description}
          </p>
          {decoration.tagName && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {decoration.tagName}
              </Badge>
            </div>
          )}
          <div className="mt-2 flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {t("customCakes.servingsCount", { count: decoration.capacity })}
            </Badge>
            {decoration.minPrepHours && (
              <Badge variant="outline" className="text-xs">
                {t("customCakes.prepHours", { count: decoration.minPrepHours })}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(decoration.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleFeatured(decoration.id)}>
              <Star className="h-4 w-4 me-2" />
              {t("common.toggleBestSeller")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(decoration)}>
              <Pencil className="h-4 w-4 me-2" />
              {t("customCakes.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(decoration)}
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
