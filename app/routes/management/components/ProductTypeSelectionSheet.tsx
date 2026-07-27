import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductSearch } from "../hooks/useProductSearch";
import { ProductSearchResults } from "./ProductSearchResults";
import type { ProductType, ProductData } from "../types";

interface ProductTypeSelectionSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: ProductData, productType: ProductType) => void;
  /** Type the dropdown starts on when the sheet opens. Defaults to featured cake. */
  initialProductType?: ProductType;
}

export function ProductTypeSelectionSheet({
  isOpen,
  onOpenChange,
  onSelectProduct,
  initialProductType = "featured-cake",
}: ProductTypeSelectionSheetProps) {
  const { t } = useTranslation();
  // Seeds the dropdown. Callers that need to re-seed it (e.g. a deep link
  // choosing the type) should remount via `key` rather than expect this to
  // re-sync on every change.
  const [selectedProductType, setSelectedProductType] = useState<
    ProductType | ""
  >(initialProductType);
  const [searchQuery, setSearchQuery] = useState("");

  const { results, isLoading, hasMore, loadMore } = useProductSearch(
    selectedProductType,
    searchQuery,
  );

  const handleSelectProduct = (product: ProductData) => {
    console.log(
      "ProductTypeSelectionSheet - Selecting product with type:",
      selectedProductType,
      "Product:",
      product,
    );
    if (!selectedProductType) {
      console.warn("No product type selected!");
      return;
    }
    onSelectProduct(product, selectedProductType as ProductType);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-135 max-w-135 overflow-y-auto pt-6">
        <SheetHeader>
          <SheetTitle>{t("regions.selectProductType")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6 px-2">
          <Select
            value={selectedProductType}
            onValueChange={(value) =>
              setSelectedProductType(value as ProductType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("regions.chooseProductType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured-cake">
                {t("regions.featuredCake")}
              </SelectItem>
              <SelectItem value="addon">{t("regions.addon")}</SelectItem>
              <SelectItem value="flavor">{t("regions.flavor")}</SelectItem>
              <SelectItem value="shape">{t("regions.shape")}</SelectItem>
              <SelectItem value="decoration">
                {t("regions.decoration")}
              </SelectItem>
              <SelectItem value="sweet">{t("regions.sweet")}</SelectItem>
              <SelectItem value="predesigned-cake">
                {t("regions.predesignedCake")}
              </SelectItem>
            </SelectContent>
          </Select>

          {selectedProductType && (
            <ProductSearchResults
              results={results}
              isLoading={isLoading}
              hasMore={hasMore}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onProductSelect={handleSelectProduct}
              onLoadMore={loadMore}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
