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
import type { Decoration } from "@/lib/services/decoration.service";

interface DecorationCardProps {
  decoration: Decoration;
  onEdit: (decoration: Decoration) => void;
  onDelete: (decoration: Decoration) => void;
}

export function DecorationCard({
  decoration,
  onEdit,
  onDelete,
}: DecorationCardProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-shadow">
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
              {decoration.capacity} servings
            </Badge>
            {decoration.minPrepHours && (
              <Badge variant="outline" className="text-xs">
                {decoration.minPrepHours}h prep
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(decoration.createdAt).toLocaleDateString()}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(decoration)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("customCakes.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(decoration)}
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
