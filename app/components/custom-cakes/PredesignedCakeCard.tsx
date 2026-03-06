"use client";

import { useTranslation } from "react-i18next";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PredesignedCake } from "@/lib/services/predesigned-cake.service";

interface PredesignedCakeCardProps {
  cake: PredesignedCake;
  onDelete: (cake: PredesignedCake) => void;
  onToggleActive: (id: string) => void;
}

export function PredesignedCakeCard({
  cake,
  onDelete,
  onToggleActive,
}: PredesignedCakeCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden relative flex flex-col h-full">
      {/* Cake Thumbnail */}
      <div className="relative h-48 w-full bg-muted/30 rounded-t-lg flex items-center justify-center flex-shrink-0">
        {cake.thumbnailUrl ? (
          <img
            src={cake.thumbnailUrl}
            alt={cake.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/70">
            <span className="text-sm text-muted-foreground">
              {t("common.noImage")}
            </span>
          </div>
        )}
        {/* Action Menu */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-background/80 hover:bg-background"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onDelete(cake)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-grow">
        <div className="flex-grow">
          <h3 className="font-semibold text-card-foreground">{cake.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cake.description}
          </p>
        </div>

        {/* Tags and Info */}
        <div className="flex flex-wrap items-center gap-2">
          {cake.tagName && (
            <Badge variant="secondary" className="text-xs">
              {cake.tagName}
            </Badge>
          )}
        </div>
      </div>

      {/* Toggle Active Button - Fixed at bottom */}
      <div className="p-4 pt-0 flex-shrink-0">
        <Button
          className="w-full gap-2"
          size="sm"
          variant={cake.isActive ? "default" : "outline"}
          onClick={() => onToggleActive(cake.id)}
        >
          {cake.isActive ? "✓ " : "○ "}
          {cake.isActive ? t("common.active") : t("common.inactive")}
        </Button>
      </div>
    </div>
  );
}
