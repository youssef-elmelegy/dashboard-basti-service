import { useState } from "react";
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
}

export function ProductTypeSelectionSheet({
  isOpen,
  onOpenChange,
  onSelectProduct,
}: ProductTypeSelectionSheetProps) {
  const [selectedProductType, setSelectedProductType] = useState<
    ProductType | ""
  >("featured-cake");
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
      <SheetContent className="w-full sm:w-135 max-w-135 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Select Product Type</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6 px-2">
          <Select
            value={selectedProductType}
            onValueChange={(value) =>
              setSelectedProductType(value as ProductType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a product type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured-cake">Featured Cake</SelectItem>
              <SelectItem value="addon">Add-on</SelectItem>
              <SelectItem value="flavor">Flavor</SelectItem>
              <SelectItem value="shape">Shape</SelectItem>
              <SelectItem value="decoration">Decoration</SelectItem>
              <SelectItem value="sweet">Sweet</SelectItem>
              <SelectItem value="predesigned-cake">Predesigned Cake</SelectItem>
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
