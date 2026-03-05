import { useState, useCallback } from "react";
import type { ProductType, ProductData, ProductSelection } from "../types";

export function useProductSelection() {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSelection>(null);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const handleSelectProductFromSheet = useCallback(
    (product: ProductData, productType: ProductType) => {
      console.log(
        "useProductSelection - handleSelectProductFromSheet called with type:",
        productType,
        "Product:",
        product,
      );
      const normalizedProduct = {
        ...product,
        price:
          typeof product.price === "string"
            ? Number(product.price)
            : product.price,
      };

      setSelectedProduct({
        type: productType,
        product: normalizedProduct as Omit<ProductData, "price"> & {
          price?: number;
        },
        selectedSizes: [],
      });
      setIsSelectionOpen(true);
    },
    [],
  );

  const handleSelectSize = useCallback(
    (size: { name: string; price: number }) => {
      if (selectedProduct?.type === "featured-cake") {
        setSelectedProduct({
          ...selectedProduct,
          selectedSizes: [...(selectedProduct.selectedSizes || []), size],
        });
      }
    },
    [selectedProduct],
  );

  const handleRemoveSize = useCallback(
    (sizeName: string) => {
      if (selectedProduct?.type === "featured-cake") {
        setSelectedProduct({
          ...selectedProduct,
          selectedSizes: (selectedProduct.selectedSizes || []).filter(
            (s) => s.name !== sizeName,
          ),
        });
      }
    },
    [selectedProduct],
  );

  const resetSelection = useCallback(() => {
    setIsSelectionOpen(false);
    setSelectedProduct(null);
    setEditingProductId(null);
  }, []);

  return {
    selectedProduct,
    setSelectedProduct,
    isSelectionOpen,
    setIsSelectionOpen,
    editingProductId,
    setEditingProductId,
    handleSelectProductFromSheet,
    handleSelectSize,
    handleRemoveSize,
    resetSelection,
  };
}
