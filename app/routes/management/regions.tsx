import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { RegionCard } from "@/components/RegionCard";
import { useRegionStore } from "@/stores/regionStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import { useAddRegionStore } from "@/stores/addRegionStore";
import { AddRegionDialog } from "@/components/AddRegionDialog";
import { useState } from "react";
import type { Region } from "@/data/regions";

export default function RegionsPage() {
  const regions = useRegionStore((state) => state.regions);
  const addRegion = useRegionStore((state) => state.addRegion);
  const updateRegion = useRegionStore((state) => state.updateRegion);
  const deleteRegion = useRegionStore((state) => state.deleteRegion);

  const { openDeleteDialog } = useDeleteDialog();
  const { openDialog: openAddRegionDialog } = useAddRegionStore();

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const handleAddRegion = (name: string) => {
    const newRegion: Region = {
      id: `region${Date.now()}`,
      name,
    };
    addRegion(newRegion);
  };

  const handleEditRegion = (name: string) => {
    if (selectedRegion) {
      updateRegion(selectedRegion.id, { name });
      setSelectedRegion(null);
    }
  };

  const handleDeleteRegion = (region: Region) => {
    openDeleteDialog(
      {
        recordName: region.name,
        recordType: "Region",
      },
      () => {
        deleteRegion(region.id);
      }
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Regions</h1>
        <Button
          className="gap-2"
          onClick={() => openAddRegionDialog({ mode: "add" }, handleAddRegion)}
        >
          <Plus className="w-4 h-4" />
          Add Region
        </Button>
      </div>

      {/* Regions Grid */}
      {regions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-3xl">🗺️</span>
            </EmptyMedia>
            <EmptyTitle>No regions yet</EmptyTitle>
            <EmptyDescription>
              Start by creating your first region to organize your bakery
              locations.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              className="gap-2"
              onClick={() =>
                openAddRegionDialog({ mode: "add" }, handleAddRegion)
              }
            >
              <Plus className="w-4 h-4" />
              Create Region
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map((region) => (
            <RegionCard
              key={region.id}
              region={region}
              onEdit={(r) => {
                setSelectedRegion(r);
                openAddRegionDialog(
                  { mode: "edit", initialValue: r.name },
                  handleEditRegion
                );
              }}
              onDelete={handleDeleteRegion}
            />
          ))}
        </div>
      )}

      <AddRegionDialog />
    </div>
  );
}
