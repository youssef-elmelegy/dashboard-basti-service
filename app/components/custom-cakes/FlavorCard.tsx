import { MoreVertical, Pencil, Trash2 } from "lucide-react";
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
}

export function FlavorCard({ flavor, onEdit, onDelete }: FlavorCardProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-shadow">
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
