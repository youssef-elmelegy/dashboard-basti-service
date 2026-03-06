import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface Region {
  id: string;
  name: string;
}

interface BakeryFilterProps {
  availableRegions: Region[];
  availableTypes: string[];
  selectedRegion: string;
  selectedTypes: string[];
  onRegionChange: (region: string) => void;
  onTypeToggle: (type: string) => void;
}

const BAKERY_TYPE_LABELS: Record<string, string> = {
  basket_cakes: "Basket Cakes",
  midume: "Midume",
  small_cakes: "Small Cakes",
  large_cakes: "Large Cakes",
  custom: "Custom",
};

export function BakeryFilter({
  availableRegions,
  availableTypes,
  selectedRegion,
  selectedTypes,
  onRegionChange,
  onTypeToggle,
}: BakeryFilterProps) {
  const { t } = useTranslation();
  const hasActiveFilters = selectedRegion !== "all" || selectedTypes.length > 0;

  const handleClearFilters = () => {
    onRegionChange("all");
    selectedTypes.forEach((type) => onTypeToggle(type));
  };

  return (
    <div className="space-y-4">
      {/* Region Selection */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          {t("bakeriesManagement.region")}
        </span>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedRegion === "all" ? "default" : "outline"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onRegionChange("all")}
          >
            {t("bakeriesManagement.allRegions")}
          </Badge>
          {availableRegions.map((region) => (
            <Badge
              key={region.id}
              variant={selectedRegion === region.id ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onRegionChange(region.id)}
            >
              {region.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Bakery Types */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          {t("bakeriesManagement.type")}
        </span>
        <div className="flex flex-wrap gap-2">
          {availableTypes.map((type) => (
            <Badge
              key={type}
              variant={selectedTypes.includes(type) ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onTypeToggle(type)}
            >
              {BAKERY_TYPE_LABELS[type] || type}
            </Badge>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            {t("bakeriesManagement.clearAllFilters")}
          </Button>
        </div>
      )}
    </div>
  );
}
