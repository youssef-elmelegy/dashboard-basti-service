import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { SelectedProductItem, ProductType, ProductData } from "../types";

interface DeleteRegionalProductOptions {
  regionId: string;
  regionalProducts: ProductData[];
  onSuccess?: (deletedProductId: string) => void;
  onError?: (error: Error) => void;
}

export function useDeleteRegionalProduct({
  onSuccess,
  onError,
}: DeleteRegionalProductOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Map product types to API format
  const productTypeToApiFormat = (
    productType: ProductType | string,
  ): string => {
    const typeMap: Record<string, string> = {
      "featured-cake": "featured-cakes",
      addon: "addons",
      sweet: "sweets",
      flavor: "flavors",
      shape: "shapes",
      decoration: "decorations",
      "predesigned-cake": "predesigned-cakes",
    };
    return typeMap[productType] || "sweets";
  };

  const deleteRegionalProduct = useCallback(
    async (
      item: SelectedProductItem & { productType?: ProductType | string },
    ) => {
      // Only delete if it's a regional product (has regionId and productId)
      if (!item.regionId || !item.productId) {
        return false;
      }

      setIsDeleting(true);

      try {
        // Use the product type if available, otherwise infer from item type
        let productType = item.productType || "sweet";

        // If no productType field, infer from item type
        if (!item.productType) {
          productType = item.type === "cake" ? "featured-cake" : "sweet";
        }

        const apiProductType = productTypeToApiFormat(productType);

        const response = await apiClient.delete(
          `/regions/${item.regionId}/products/${apiProductType}/${item.productId}`,
        );

        if (response.data) {
          onSuccess?.(item.productId);
          return true;
        }

        return false;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error deleting regional product:", err);
        onError?.(err);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [onSuccess, onError],
  );

  const handleDeleteProduct = useCallback(
    async (item: SelectedProductItem) => {
      const success = await deleteRegionalProduct(item);
      return success;
    },
    [deleteRegionalProduct],
  );

  return {
    handleDeleteProduct,
    isDeleting,
  };
}
