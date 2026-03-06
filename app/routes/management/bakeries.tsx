import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BakeryCard } from "@/components/BakeryCard";
import { AddBakery } from "@/components/AddBakery";
import { EditBakery } from "@/components/EditBakery";
import { BakeryFilter } from "@/components/BakeryFilter";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useRegionStore } from "@/stores/regionStore";
import { useState, useMemo, useEffect } from "react";
import type { Bakery, BakeryType } from "@/lib/services/bakery.service";

export default function BakeriesPage() {
  const { t } = useTranslation();
  const bakeries = useBakeryStore((state) => state.bakeries);
  const isLoading = useBakeryStore((state) => state.isLoading);
  const error = useBakeryStore((state) => state.error);
  const fetchBakeries = useBakeryStore((state) => state.fetchBakeries);
  const addBakery = useBakeryStore((state) => state.addBakery);
  const updateBakery = useBakeryStore((state) => state.updateBakery);
  const deleteBakery = useBakeryStore((state) => state.deleteBakery);
  const clearError = useBakeryStore((state) => state.clearError);
  const regions = useRegionStore((state) => state.regions);
  const fetchRegions = useRegionStore((state) => state.fetchRegions);

  const { openDeleteDialog } = useDeleteDialog();

  const [selectedBakery, setSelectedBakery] = useState<Bakery | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Fetch bakeries and regions on mount
  useEffect(() => {
    fetchBakeries();
    // Fetch regions if not already fetched
    if (regions.length === 0) {
      fetchRegions();
    }
  }, [fetchBakeries, fetchRegions, regions.length]);

  // Get all unique bakery types from bakeries
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    bakeries.forEach((bakery) => {
      bakery.types.forEach((type) => types.add(type));
    });
    return Array.from(types).sort();
  }, [bakeries]);

  // Get available regions
  const availableRegions = useMemo(() => {
    return regions;
  }, [regions]);

  // Filter bakeries
  const filteredBakeries = useMemo(() => {
    return bakeries.filter((bakery) => {
      // Filter by region
      if (selectedRegion !== "all") {
        if (bakery.regionId !== selectedRegion) return false;
      }

      // Filter by types
      if (selectedTypes.length > 0) {
        const hasMatchingType = bakery.types.some((type) =>
          selectedTypes.includes(type),
        );
        if (!hasMatchingType) return false;
      }

      return true;
    });
  }, [bakeries, selectedRegion, selectedTypes]);

  const handleAddBakery = async (data: {
    name: string;
    locationDescription: string;
    regionId: string;
    capacity: number;
    bakeryTypes: BakeryType[];
  }) => {
    try {
      await addBakery(data);
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to add bakery:", error);
    }
  };

  const handleEditBakery = async (
    data: Omit<
      Bakery,
      "id" | "averageRating" | "totalReviews" | "createdAt" | "updatedAt"
    >,
  ) => {
    if (selectedBakery) {
      try {
        await updateBakery(selectedBakery.id, {
          name: data.name,
          locationDescription: data.locationDescription,
          regionId: data.regionId,
          capacity: data.capacity,
          bakeryTypes: data.types,
        });
        setIsEditOpen(false);
        setSelectedBakery(null);
      } catch (error) {
        console.error("Failed to update bakery:", error);
      }
    }
  };

  const handleDeleteBakery = (bakery: Bakery) => {
    openDeleteDialog(
      {
        title: t("bakeriesManagement.deleteBakery"),
        description: (
          <>
            {t("bakeriesManagement.deleteBakeryDescription")}{" "}
            <strong>{bakery.name}</strong>? {t("common.cannotBeUndone")}
          </>
        ),
        recordName: bakery.name,
        recordType: t("bakeriesManagement.recordType"),
      },
      async () => {
        try {
          await deleteBakery(bakery.id);
        } catch (error) {
          console.error("Failed to delete bakery:", error);
        }
      },
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/management/regions">
                {t("bakeriesManagement.breadcrumbRegions")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {t("bakeriesManagement.breadcrumbBakeries")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {t("bakeriesManagement.title")}
          </h1>
          <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2" disabled={isLoading}>
                <Plus className="w-4 h-4" />
                {t("bakeriesManagement.addBakery")}
              </Button>
            </SheetTrigger>
            <AddBakery onSubmit={handleAddBakery} />
          </Sheet>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">{t("common.error")}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={clearError}
              className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
            >
              {t("common.dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && bakeries.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      ) : bakeries.length > 0 ? (
        <>
          <BakeryFilter
            availableRegions={availableRegions}
            availableTypes={availableTypes}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
            selectedTypes={selectedTypes}
            onTypeToggle={handleTypeToggle}
          />

          {filteredBakeries.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <span className="text-3xl">🍰</span>
                </EmptyMedia>
                <EmptyTitle>{t("bakeriesManagement.noBakeries")}</EmptyTitle>
                <EmptyDescription>
                  {t("bakeriesManagement.noBakeriesMatch")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBakeries.map((bakery) => (
                <Sheet
                  key={bakery.id}
                  open={isEditOpen && selectedBakery?.id === bakery.id}
                  onOpenChange={setIsEditOpen}
                >
                  <BakeryCard
                    bakery={bakery}
                    onEdit={(b) => {
                      setSelectedBakery(b);
                      setIsEditOpen(true);
                    }}
                    onDelete={handleDeleteBakery}
                  />
                  <EditBakery bakery={bakery} onSubmit={handleEditBakery} />
                </Sheet>
              ))}
            </div>
          )}
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-3xl">🍰</span>
            </EmptyMedia>
            <EmptyTitle>{t("bakeriesManagement.noBakeries")}</EmptyTitle>
            <EmptyDescription>
              {t("bakeriesManagement.startCreating")}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("bakeriesManagement.createBakery")}
                </Button>
              </SheetTrigger>
              <AddBakery onSubmit={handleAddBakery} />
            </Sheet>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
