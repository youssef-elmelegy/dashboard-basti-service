import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReadyCake, AddOn } from "@/data/products";

interface ProductSelection {
  type: "cake" | "sweet";
  product: ReadyCake | AddOn;
  selectedSizes: Array<{ name: string; price: number }>;
}

interface ProductSelectionSheetProps {
  selectedProduct: ProductSelection | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onSelectSize: (size: { name: string; price: number }) => void;
  onRemoveSize: (sizeName: string) => void;
}

export function ProductSelectionSheet({
  selectedProduct,
  isOpen,
  onOpenChange,
  onConfirm,
  onSelectSize,
  onRemoveSize,
}: ProductSelectionSheetProps) {
  if (!selectedProduct) return null;

  const isSweet = selectedProduct.type === "sweet";
  const isCake = selectedProduct.type === "cake";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Select {isCake ? "Cake" : "Sweet"}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 pb-6">
          {/* Product Image */}
          <div className="aspect-square rounded-lg overflow-hidden">
            <img
              src={selectedProduct.product.images?.[0]}
              alt={selectedProduct.product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div>
            <h3 className="text-xl font-bold">
              {selectedProduct.product.name}
            </h3>
            <p className="text-muted-foreground mt-2">
              {selectedProduct.product.description}
            </p>
          </div>

          {/* Size Selection for Cakes */}
          {isCake && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Select Sizes (Multiple)
              </label>
              <div className="space-y-2">
                {(selectedProduct.product as SmallCake).sizes.map((size) => {
                  const isSelected = selectedProduct.selectedSizes.some(
                    (s) => s.name === size.name
                  );
                  return (
                    <Button
                      key={size.name}
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-between"
                      onClick={() => {
                        if (isSelected) {
                          onRemoveSize(size.name);
                        } else {
                          onSelectSize(size);
                        }
                      }}
                    >
                      <span>{size.name}</span>
                      <span className="font-bold">${size.price}</span>
                    </Button>
                  );
                })}
              </div>
              {selectedProduct.selectedSizes.length > 0 && (
                <div className="bg-muted p-2 rounded text-sm">
                  <p className="font-semibold mb-1">Selected Sizes:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.selectedSizes.map((size) => (
                      <Badge key={size.name} variant="secondary">
                        {size.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price Display for Sweets */}
          {isSweet && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="text-2xl font-bold">
                  ${(selectedProduct.product as AddOn).price}
                </span>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <Button
            className="w-full"
            disabled={isCake && selectedProduct.selectedSizes.length === 0}
            onClick={onConfirm}
          >
            {isCake
              ? selectedProduct.selectedSizes.length > 0
                ? `Add to Selection (${selectedProduct.selectedSizes.length} sizes)`
                : "Select at least one size"
              : "Add to Selection"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
