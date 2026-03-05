import { useCallback } from "react";
import { useRegionProductSelectionStore } from "@/stores/regionProductSelectionStore";
import { useStockStore } from "@/stores/stockStore";
import type { SmallCake, AddOn } from "@/data/products";
import type {
  SelectedProductItem,
  ProductData,
  ProductSelection,
} from "../types";
import { submitRegionalPricing } from "../utils/regionPricingHelper";

interface UseConfirmSelectionProps {
  currentRegion: { id: string; name: string } | null;
  selectedProduct: ProductSelection;
  editingProductId: string | null;
  setRegionalProducts: (
    callback: (prev: ProductData[]) => ProductData[],
  ) => void;
  setEditingProductId: (id: string | null) => void;
  resetSelection: () => void;
}

export function useConfirmSelectionHandler({
  currentRegion,
  selectedProduct,
  editingProductId,
  setRegionalProducts,
  setEditingProductId,
  resetSelection,
}: UseConfirmSelectionProps) {
  const addProduct = useRegionProductSelectionStore(
    (state) => state.addProduct,
  );
  const updateProduct = useRegionProductSelectionStore(
    (state) => state.updateProduct,
  );

  const handleConfirmSelection = useCallback(
    async (regionPrice: number, sizePrices?: Record<string, number>) => {
      if (!selectedProduct || !currentRegion) return;

      try {
        console.log(
          "handleConfirmSelection - selectedProduct.type:",
          selectedProduct.type,
        );
        await submitRegionalPricing(
          selectedProduct.type,
          currentRegion.id,
          selectedProduct.product.id,
          regionPrice,
          sizePrices,
        );

        const isEditingRegionalProduct =
          editingProductId?.startsWith("regional-");

        if (editingProductId && isEditingRegionalProduct) {
          const productId = editingProductId.replace("regional-", "");
          setRegionalProducts((prevProducts) =>
            prevProducts.map((p) =>
              p.id === productId
                ? {
                    ...p,
                    price: regionPrice,
                    sizesPrices: sizePrices
                      ? Object.fromEntries(
                          Object.entries(sizePrices).map(([k, v]) => [
                            k,
                            v.toString(),
                          ]),
                        )
                      : p.sizesPrices,
                  }
                : p,
            ),
          );
          setEditingProductId(null);
        } else if (editingProductId && !isEditingRegionalProduct) {
          const product = selectedProduct.product;
          const isCake = selectedProduct.type === "featured-cake";

          const updated: Partial<SelectedProductItem> = {
            type: isCake ? "cake" : "sweet",
            productId: product.id,
            productName: product.name || product.title || "",
            productImage:
              product.images?.[0] ||
              product.shapeUrl ||
              product.flavorUrl ||
              product.decorationUrl ||
              "",
            basePrice: regionPrice,
            selectedSizes:
              selectedProduct.type === "featured-cake"
                ? selectedProduct.selectedSizes
                : [],
          };
          updateProduct(editingProductId, updated);
          setEditingProductId(null);
        } else {
          const storeType: "cake" | "sweet" =
            selectedProduct.type === "featured-cake" ||
            selectedProduct.type === "predesigned-cake"
              ? "cake"
              : "sweet";

          addProduct(
            currentRegion.name,
            currentRegion.id,
            storeType,
            selectedProduct.product as unknown as SmallCake | AddOn,
            selectedProduct.type === "featured-cake"
              ? selectedProduct.selectedSizes
              : undefined,
            regionPrice,
            selectedProduct.type,
          );

          if (selectedProduct.type === "addon") {
            const addStock = useStockStore.getState().addStock;
            addStock({
              id: `stock-${currentRegion.id}-${selectedProduct.product.id}`,
              bakeryId: "",
              regionId: currentRegion.id,
              regionName: currentRegion.name,
              addOnId: selectedProduct.product.id,
              addOnName:
                selectedProduct.product.name ||
                selectedProduct.product.title ||
                "",
              currentStock: 0,
              maxStock: 100,
              lastRestocked: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
        resetSelection();
      } catch (error) {
        console.error("Failed to create regional pricing:", error);
        alert("Failed to add product to region. Please try again.");
      }
    },
    [
      selectedProduct,
      currentRegion,
      editingProductId,
      setRegionalProducts,
      setEditingProductId,
      resetSelection,
      addProduct,
      updateProduct,
    ],
  );

  return { handleConfirmSelection };
}
