import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useState } from "react";

type ProductType =
  | "featured-cake"
  | "addon"
  | "flavor"
  | "shape"
  | "decoration"
  | "sweet"
  | "predesigned-cake";

interface ProductData {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  images?: string[];
  shapeUrl?: string;
  flavorUrl?: string;
  decorationUrl?: string;
  mainPrice?: number;
  price?: number;
  sizes?: Array<{ name: string; price: number } | string>;
}

interface ProductSelection {
  type: ProductType;
  product: ProductData;
  selectedSizes?: Array<{ name: string; price: number }>;
}

interface ProductSelectionSheetProps {
  selectedProduct: ProductSelection | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (price: number, sizePrices?: Record<string, number>) => void;
  onSelectSize: (size: { name: string; price: number }) => void;
  onRemoveSize: (sizeName: string) => void;
}

export function ProductSelectionSheet({
  selectedProduct,
  isOpen,
  onOpenChange,
  onConfirm,
}: ProductSelectionSheetProps) {
  const { t } = useTranslation();
  const [regionPrice, setRegionPrice] = useState<number>(0);
  const [sizePrices, setSizePrices] = useState<Record<string, number>>({});

  if (!selectedProduct) return null;

  const isCake = selectedProduct.type === "featured-cake";
  const isPredesignedCake = selectedProduct.type === "predesigned-cake";
  const isSweet = selectedProduct.type === "sweet";
  const productName =
    selectedProduct.product.name || selectedProduct.product.title || "Product";
  const productImage =
    selectedProduct.product.images?.[0] ||
    selectedProduct.product.shapeUrl ||
    selectedProduct.product.flavorUrl ||
    selectedProduct.product.decorationUrl;
  const productPrice = isCake
    ? selectedProduct.product.mainPrice
    : selectedProduct.product.price;
  const productSizes = selectedProduct.product.sizes || [];
  const showSizeSelection = (isCake || isSweet) && productSizes.length > 0;

  // Normalize sizes to always be strings
  const normalizedSizes = productSizes.map((size) =>
    typeof size === "string" ? size : size.name,
  );

  const handleConfirm = () => {
    // Predesigned cakes don't require a price input
    if (!isPredesignedCake && regionPrice <= 0) {
      alert(t("regions.pleaseEnterValidPrice"));
      return;
    }
    onConfirm(regionPrice || 0, showSizeSelection ? sizePrices : undefined);
    setRegionPrice(0);
    setSizePrices({});
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto py-6">
        <SheetHeader>
          <SheetTitle>{t("regions.productDetails")}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 pb-6">
          {/* Product Image */}
          {productImage && (
            <div className="aspect-square rounded-lg overflow-hidden">
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Product Info */}
          <div>
            <h3 className="text-xl font-bold">{productName}</h3>
            {selectedProduct.product.description && (
              <p className="text-muted-foreground mt-2">
                {selectedProduct.product.description}
              </p>
            )}
            {selectedProduct.product.category && (
              <p className="text-sm text-muted-foreground mt-1">
                Category: {selectedProduct.product.category}
              </p>
            )}
          </div>

          {/* Regional Price Input - Hidden for Predesigned Cakes */}
          {!isPredesignedCake && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("regions.priceInRegion")}
              </label>
              <div className="flex gap-2">
                <span className="flex items-center text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  placeholder={t("regions.enterPrice")}
                  value={regionPrice || ""}
                  onChange={(e) =>
                    setRegionPrice(parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              {productPrice && (
                <p className="text-xs text-muted-foreground">
                  {t("regions.originalPrice")} ${productPrice}
                </p>
              )}
            </div>
          )}

          {/* Size Price Inputs for Cakes and Sweets */}
          {showSizeSelection && (
            <div className="space-y-4">
              {normalizedSizes.map((sizeName) => (
                <div key={sizeName} className="space-y-2">
                  <label className="text-sm font-medium">{sizeName}</label>
                  <div className="flex gap-2">
                    <span className="flex items-center text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder={`Enter ${sizeName} price`}
                      value={sizePrices[sizeName] || ""}
                      onChange={(e) =>
                        setSizePrices({
                          ...sizePrices,
                          [sizeName]: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confirm Button */}
          <Button
            className="w-full"
            disabled={!isPredesignedCake && regionPrice <= 0}
            onClick={handleConfirm}
          >
            {t("regions.addToRegion")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
