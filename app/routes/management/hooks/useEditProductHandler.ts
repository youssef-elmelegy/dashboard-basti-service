import { useCallback } from "react";
import type { SelectedProductItem } from "../types";
import type { ProductData, ProductSelection } from "../types";
import { mapApiTypeToProductType } from "../utils/productTransformers";

interface UseEditProductHandlerProps {
  regionalProducts: ProductData[];
  setSelectedProduct: (product: ProductSelection) => void;
  setEditingProductId: (id: string | null) => void;
  setIsSelectionOpen: (open: boolean) => void;
}

export function useEditProductHandler({
  regionalProducts,
  setSelectedProduct,
  setEditingProductId,
  setIsSelectionOpen,
}: UseEditProductHandlerProps) {
  // Every item rendered on this page comes from
  // `transformRegionalProductsToItems`, which sources rows from the regional
  // products API and ids them `regional-<productId>`. So the product being
  // edited is always found in `regionalProducts` — there is no local-store
  // fallback to fall back to.
  const handleEditProduct = useCallback(
    (item: SelectedProductItem) => {
      const apiProduct = regionalProducts.find((p) => p.id === item.productId);
      if (!apiProduct) return;

      const normalizedData = {
        ...apiProduct,
        price:
          typeof apiProduct.price === "string"
            ? Number(apiProduct.price)
            : apiProduct.price,
      };

      const apiType =
        (apiProduct as unknown as { type?: string }).type || "sweet";
      const selectionType = mapApiTypeToProductType(apiType);

      setSelectedProduct({
        type: selectionType,
        product: normalizedData as Omit<ProductData, "price"> & {
          price?: number;
        },
        selectedSizes: item.selectedSizes || [],
      });
      setEditingProductId(item.id);
      setIsSelectionOpen(true);
    },
    [
      regionalProducts,
      setSelectedProduct,
      setEditingProductId,
      setIsSelectionOpen,
    ],
  );

  return { handleEditProduct };
}
