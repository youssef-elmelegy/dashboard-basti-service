import { Plus } from "lucide-react";
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
import { useState, useMemo } from "react";
import type { Bakery } from "@/data/bakeries";

export default function BakeriesPage() {
  const { t } = useTranslation();
  const bakeries = useBakeryStore((state) => state.bakeries);
  const addBakery = useBakeryStore((state) => state.addBakery);
  const updateBakery = useBakeryStore((state) => state.updateBakery);
  const deleteBakery = useBakeryStore((state) => state.deleteBakery);
  const regions = useRegionStore((state) => state.regions);

  const { openDeleteDialog } = useDeleteDialog();

  const [selectedBakery, setSelectedBakery] = useState<Bakery | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Get all unique regions from region store
  const availableRegions = useMemo(
    () => regions.map((r) => r.name).sort(),
    [regions]
  );

  // Get all unique bakery types from bakeries
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    bakeries.forEach((bakery) => {
      bakery.types.forEach((type) => types.add(type));
    });
    return Array.from(types).sort();
  }, [bakeries]);

  // Filter bakeries
  const filteredBakeries = useMemo(() => {
    return bakeries.filter((bakery) => {
      // Filter by region
      if (selectedRegion !== "all") {
        if (!bakery.regions.includes(selectedRegion)) return false;
      }

      // Filter by types
      if (selectedTypes.length > 0) {
        const hasMatchingType = bakery.types.some((type) =>
          selectedTypes.includes(type)
        );
        if (!hasMatchingType) return false;
      }

      return true;
    });
  }, [bakeries, selectedRegion, selectedTypes]);

  const handleAddBakery = (data: Omit<Bakery, "id">) => {
    const newBakery: Bakery = {
      ...data,
      id: `bakery${Date.now()}`,
    };
    addBakery(newBakery);
    setIsAddOpen(false);
  };

  const handleEditBakery = (data: Bakery) => {
    if (selectedBakery) {
      updateBakery(selectedBakery.id, data);
      setIsEditOpen(false);
      setSelectedBakery(null);
    }
  };

  const handleDeleteBakery = (bakery: Bakery) => {
    openDeleteDialog(
      {
        recordName: bakery.name,
        recordType: t("bakeriesManagement.recordType"),
      },
      () => {
        deleteBakery(bakery.id);
      }
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
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
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("bakeriesManagement.addBakery")}
              </Button>
            </SheetTrigger>
            <AddBakery
              onSubmit={(data) => handleAddBakery(data as Omit<Bakery, "id">)}
            />
          </Sheet>
        </div>
      </div>

      {/* Filters */}
      {bakeries.length > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <BakeryFilter
            availableRegions={availableRegions}
            availableTypes={availableTypes}
            selectedRegion={selectedRegion}
            selectedTypes={selectedTypes}
            onRegionChange={setSelectedRegion}
            onTypeToggle={handleTypeToggle}
          />
        </div>
      )}

      {/* Bakeries Grid */}
      {filteredBakeries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-2xl">📦</span>
            </EmptyMedia>
            <EmptyTitle>
              {bakeries.length === 0
                ? t("bakeriesManagement.noBakeries")
                : t("bakeriesManagement.noBakeriesMatch")}
            </EmptyTitle>
            <EmptyDescription>
              {bakeries.length === 0
                ? t("bakeriesManagement.startAdding")
                : t("bakeriesManagement.tryAdjusting")}
            </EmptyDescription>
          </EmptyHeader>
          {bakeries.length === 0 && (
            <EmptyContent>
              <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                <SheetTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t("bakeriesManagement.addFirstBakery")}
                  </Button>
                </SheetTrigger>
                <AddBakery
                  onSubmit={(data) =>
                    handleAddBakery(data as Omit<Bakery, "id">)
                  }
                />
              </Sheet>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBakeries.map((bakery) => (
            <Sheet
              key={bakery.id}
              open={isEditOpen && selectedBakery?.id === bakery.id}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedBakery(null);
                  setIsEditOpen(false);
                }
              }}
            >
              <BakeryCard
                bakery={bakery}
                onEdit={(b) => {
                  setSelectedBakery(b);
                  setIsEditOpen(true);
                }}
                onDelete={handleDeleteBakery}
              />
              {selectedBakery?.id === bakery.id && (
                <EditBakery
                  bakery={selectedBakery}
                  onSubmit={handleEditBakery}
                />
              )}
            </Sheet>
          ))}
        </div>
      )}
    </div>
  );
}
