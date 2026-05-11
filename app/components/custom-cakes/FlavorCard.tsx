import { MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Flavor } from "@/lib/services/flavor.service";

interface FlavorCardProps {
  flavor: Flavor;
  onEdit: (flavor: Flavor) => void;
  onDelete: (flavor: Flavor) => void;
  onToggleFeatured: (id: string) => void;
}

export function FlavorCard({
  flavor,
  onEdit,
  onDelete,
  onToggleFeatured,
}: FlavorCardProps) {
  const { t } = useTranslation();
  return (
    <div className="relative rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-shadow">
      {flavor.isFeatured && (
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
          src={flavor.flavorUrl}
          alt={flavor.title}
          className="h-24 w-24 rounded-md object-contain"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{flavor.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {flavor.description}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(flavor.createdAt).toLocaleDateString()}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleFeatured(flavor.id)}>
              <Star className="h-4 w-4 mr-2" />
              {t("common.toggleBestSeller")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(flavor)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("customCakes.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(flavor)}
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
