import { useCallback } from "react";
import { useSmallCakeStore } from "@/stores/smallCakeStore";
import { useAddOnStore } from "@/stores/addOnStore";
import type { SelectedProductItem } from "../types";
import type { ProductData, ProductSelection } from "../types";
import {
  convertStoreProductToProductData,
  mapApiTypeToProductType,
} from "../utils/productTransformers";

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
  const smallCakes = useSmallCakeStore((state) => state.smallCakes);
  const addOns = useAddOnStore((state) => state.addOns);

  const handleEditProduct = useCallback(
    (item: SelectedProductItem) => {
      if (item.id.startsWith("regional-")) {
        const apiProduct = regionalProducts.find(
          (p) => p.id === item.productId,
        );
        if (apiProduct) {
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
        }
      } else {
        const product =
          item.type === "cake"
            ? smallCakes.find((c) => c.id === item.productId)
            : addOns.find((s) => s.id === item.productId);

        if (product) {
          const productData = convertStoreProductToProductData(product);
          const normalizedData = {
            ...productData,
            price:
              typeof productData.price === "number"
                ? productData.price
                : Number(productData.price),
          };

          setSelectedProduct({
            type: item.type === "cake" ? "featured-cake" : "addon",
            product: normalizedData as Omit<ProductData, "price"> & {
              price?: number;
            },
            selectedSizes: item.selectedSizes || [],
          });
          setEditingProductId(item.id);
          setIsSelectionOpen(true);
        }
      }
    },
    [
      smallCakes,
      addOns,
      regionalProducts,
      setSelectedProduct,
      setEditingProductId,
      setIsSelectionOpen,
    ],
  );

  return { handleEditProduct };
}
