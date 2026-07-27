import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductType } from "../types";

export const ALL_PRODUCT_TYPES = "all" as const;

export type ProductTypeFilterValue = ProductType | typeof ALL_PRODUCT_TYPES;

const PRODUCT_TYPE_OPTIONS: Array<{ value: ProductType; labelKey: string }> = [
  { value: "featured-cake", labelKey: "regions.featuredCake" },
  { value: "addon", labelKey: "regions.addon" },
  { value: "flavor", labelKey: "regions.flavor" },
  { value: "shape", labelKey: "regions.shape" },
  { value: "decoration", labelKey: "regions.decoration" },
  { value: "sweet", labelKey: "regions.sweet" },
  { value: "predesigned-cake", labelKey: "regions.predesignedCake" },
];

interface ProductTypeFilterProps {
  value: ProductTypeFilterValue;
  onChange: (value: ProductTypeFilterValue) => void;
}

export function ProductTypeFilter({ value, onChange }: ProductTypeFilterProps) {
  const { t } = useTranslation();

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ProductTypeFilterValue)}
    >
      <SelectTrigger className="w-56">
        <SelectValue placeholder={t("regions.filterByType")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_PRODUCT_TYPES}>
          {t("regions.allTypes")}
        </SelectItem>
        {PRODUCT_TYPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
