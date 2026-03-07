import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFilterProps {
  activeFilter: "all" | "active" | "inactive";
  onActiveFilterChange: (filter: "all" | "active" | "inactive") => void;
}

export function ProductFilter({
  activeFilter,
  onActiveFilterChange,
}: ProductFilterProps) {
  const { t } = useTranslation();
  const hasActiveFilters = activeFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        {/* Status Filter */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-sm font-medium">{t("filters.status")}</label>
          <Select
            value={activeFilter}
            onValueChange={(value) =>
              onActiveFilterChange(value as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.selectStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allProducts")}</SelectItem>
              <SelectItem value="active">{t("filters.activeOnly")}</SelectItem>
              <SelectItem value="inactive">
                {t("filters.inactiveOnly")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onActiveFilterChange("all");
          }}
          className="w-full"
        >
          {t("filters.clearAllFilters")}
        </Button>
      )}
    </div>
  );
}
