import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useRegionStore } from "@/stores/regionStore";
import { useRegionProductSelectionStore } from "@/stores/regionProductSelectionStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import React from "react";
import { RegionHeader } from "@/components/RegionHeader";
import { ProductSelectionSheet } from "@/components/ProductSelectionSheet";
import { Plus, Truck } from "lucide-react";

import { ProductTypeSelectionSheet } from "./components/ProductTypeSelectionSheet";
import {
  ProductTypeFilter,
  ALL_PRODUCT_TYPES,
  type ProductTypeFilterValue,
} from "./components/ProductTypeFilter";
import { SelectedProductsTable } from "./components/SelectedProductsTable";
import { useRegionalProducts } from "./hooks/useRegionalProducts";
import { useProductSelection } from "./hooks/useProductSelection";
import { useEditProductHandler } from "./hooks/useEditProductHandler";
import { useConfirmSelectionHandler } from "./hooks/useConfirmSelectionHandler";
import { useDeleteRegionalProduct } from "./hooks/useDeleteRegionalProduct";
import {
  transformRegionalProductsToItems,
  mapProductTypeToApiType,
} from "./utils/productTransformers";
import {
  ADD_TYPE_PARAM,
  parseAddTypeParam,
} from "./utils/regionAddProductLink";
import type { SelectedProductItem, ProductType } from "./types";

export default function RegionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTypeDialogOpen, setIsTypeDialogOpen] = React.useState(false);
  const [typeFilter, setTypeFilter] =
    React.useState<ProductTypeFilterValue>(ALL_PRODUCT_TYPES);
  const { openDeleteDialog } = useDeleteDialog();

  // Deep link (e.g. "Add Stock" on a bakery) asking us to open the add sheet
  // on a specific product type. Captured into state and stripped from the URL
  // so closing the sheet doesn't leave a param that reopens it on refresh.
  const requestedAddType = parseAddTypeParam(searchParams.get(ADD_TYPE_PARAM));
  const [initialAddType, setInitialAddType] = React.useState<
    ProductType | undefined
  >(requestedAddType ?? undefined);

  React.useEffect(() => {
    if (!requestedAddType) return;

    setInitialAddType(requestedAddType);
    setIsTypeDialogOpen(true);
    // Also focus the table on the type being added, so the newly added item is
    // visible in the list behind the sheet.
    setTypeFilter(requestedAddType);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(ADD_TYPE_PARAM);
    setSearchParams(nextParams, { replace: true });
  }, [requestedAddType, searchParams, setSearchParams]);

  // Region hooks
  const currentRegion = useRegionStore((state) => state.currentRegion);
  const fetchRegionById = useRegionStore((state) => state.fetchRegionById);
  const isLoading = useRegionStore((state) => state.isLoading);

  // Product selection hook
  const {
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
  } = useProductSelection();

  // Regional products hook — the type filter is applied server-side so the
  // backend skips the product families we don't need entirely.
  const apiTypeFilter = React.useMemo(
    () =>
      typeFilter === ALL_PRODUCT_TYPES
        ? undefined
        : [mapProductTypeToApiType(typeFilter)],
    [typeFilter],
  );

  const {
    products: regionalProducts,
    isLoading: isLoadingRegionalProducts,
    setProducts: setRegionalProducts,
  } = useRegionalProducts(id, apiTypeFilter);

  // Edit product handler hook
  const { handleEditProduct } = useEditProductHandler({
    regionalProducts,
    setSelectedProduct,
    setEditingProductId,
    setIsSelectionOpen,
  });

  const { handleDeleteProduct } = useDeleteRegionalProduct({
    regionId: id || "",
    regionalProducts,
    onSuccess: (deletedProductId) => {
      // Remove from regional products (from API)
      setRegionalProducts(
        regionalProducts.filter((p) => p.id !== deletedProductId),
      );
    },
    onError: (error) => {
      console.error("Failed to delete product:", error);
    },
  });

  // Confirm selection handler hook
  const { handleConfirmSelection } = useConfirmSelectionHandler({
    currentRegion,
    selectedProduct,
    editingProductId,
    setRegionalProducts,
    setEditingProductId,
    resetSelection,
  });

  // Fetch region details
  React.useEffect(() => {
    if (id) {
      fetchRegionById(id).catch((error) => {
        console.error("Failed to fetch region details:", error);
      });
    }
  }, [id, fetchRegionById]);

  // Transform regional products
  const transformedRegionalProducts: SelectedProductItem[] =
    transformRegionalProductsToItems(
      regionalProducts,
      currentRegion?.id || "",
      currentRegion?.name || "",
    );

  const selectedProducts = useRegionProductSelectionStore(
    (state) => state.selectedProducts,
  );
  // Products still staged in the store are filtered client-side to match the
  // server-side filter already applied to the fetched ones.
  const regionSelectedProducts = [
    ...transformedRegionalProducts,
    ...selectedProducts.filter(
      (p) =>
        p.regionName === currentRegion?.name &&
        (typeFilter === ALL_PRODUCT_TYPES || p.productType === typeFilter),
    ),
  ];

  const region = currentRegion;

  if (isLoading && !region) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">{t("common.loading")}</h1>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">
          {t("regions.regionNotFound")}
        </h1>
        <Button onClick={() => navigate("/management/regions")}>
          {t("regions.backToRegions")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <RegionHeader regionName={region.name} />

      {/* Region Drivers entry */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <h2 className="text-lg font-semibold">{t("drivers.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("drivers.regionDriversHint")}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/management/regions/${id}/drivers`)}
        >
          <Truck className="w-4 h-4" />
          {t("drivers.manageDrivers")}
        </Button>
      </div>

      {/* Add Products Button Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("regions.products")}
        </h2>
        <Button onClick={() => setIsTypeDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("regions.addProduct")}
        </Button>
      </div>

      {/* Product Type Selection Sheet */}
      <ProductTypeSelectionSheet
        key={initialAddType ?? "default"}
        isOpen={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onSelectProduct={handleSelectProductFromSheet}
        initialProductType={initialAddType}
      />

      {/* Selected Products Table */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {t("regions.selectedProducts")}
          </h2>
          <ProductTypeFilter value={typeFilter} onChange={setTypeFilter} />
        </div>
        <SelectedProductsTable
          isLoading={isLoadingRegionalProducts}
          data={regionSelectedProducts}
          onRemoveProduct={(id) => {
            const item = regionSelectedProducts.find((p) => p.id === id);
            if (item) {
              openDeleteDialog(
                {
                  title: t("regions.deleteProduct"),
                  description: (
                    <>
                      {t("regions.deleteProductDescription")}{" "}
                      <strong>{item.productName}</strong>?{" "}
                      {t("common.cannotBeUndone")}
                    </>
                  ),
                  recordName: item.productName,
                  recordType: t("common.product"),
                },
                async () => {
                  // Check if it's a regional product (starts with "regional-")
                  if (item.id.startsWith("regional-")) {
                    // Optimistically remove from UI first
                    setRegionalProducts(
                      regionalProducts.filter((p) => p.id !== item.productId),
                    );
                    // Then delete from API in background
                    handleDeleteProduct(item).catch(() => {
                      // If delete fails, we could add it back (but for now just log)
                      console.error("Failed to delete product");
                    });
                  } else {
                    // It's a product from the store, just remove it from store
                    const removeProduct =
                      useRegionProductSelectionStore.getState().removeProduct;
                    removeProduct(id);
                  }
                },
              );
            }
          }}
          onEditProduct={handleEditProduct}
        />
      </div>

      <hr className="my-8" />

      {/* Product Selection Sheet */}
      <ProductSelectionSheet
        selectedProduct={selectedProduct}
        isOpen={isSelectionOpen}
        onOpenChange={setIsSelectionOpen}
        onConfirm={handleConfirmSelection}
        onSelectSize={handleSelectSize}
        onRemoveSize={handleRemoveSize}
      />
    </div>
  );
}
