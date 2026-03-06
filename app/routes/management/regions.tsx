import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { RegionFormDialog } from "@/components/RegionFormDialog";
import { useEffect } from "react";
import type { Region } from "@/data/regions";

export default function RegionsPage() {
  const { t } = useTranslation();
  const regions = useRegionStore((state) => state.regions);
  const isLoading = useRegionStore((state) => state.isLoading);
  const error = useRegionStore((state) => state.error);
  const fetchRegions = useRegionStore((state) => state.fetchRegions);
  const deleteRegion = useRegionStore((state) => state.deleteRegion);
  const clearError = useRegionStore((state) => state.clearError);

  const { openDeleteDialog } = useDeleteDialog();
  const { openDialog: openAddRegionDialog } = useAddRegionStore();

  // Fetch regions on component mount
  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const handleDeleteRegion = (region: Region) => {
    openDeleteDialog(
      {
        title: t("regions.deleteTitle"),
        description: (
          <>
            {t("regions.deleteDescription")} <strong>{region.name}</strong>?{" "}
            {t("common.cannotBeUndone")}
          </>
        ),
        recordName: region.name,
        recordType: t("regions.recordType"),
      },
      async () => {
        try {
          await deleteRegion(region.id);
        } catch (error) {
          console.error("Failed to delete region:", error);
        }
      },
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("regions.title")}</h1>
        <Button
          className="gap-2"
          onClick={() => openAddRegionDialog({ mode: "add" })}
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          {t("regions.addRegion")}
        </Button>
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
      {isLoading && regions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      ) : regions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-3xl">🗺️</span>
            </EmptyMedia>
            <EmptyTitle>{t("regions.noRegions")}</EmptyTitle>
            <EmptyDescription>{t("regions.startCreating")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              className="gap-2"
              onClick={() => openAddRegionDialog({ mode: "add" })}
            >
              <Plus className="w-4 h-4" />
              {t("regions.createRegion")}
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
                openAddRegionDialog({
                  mode: "edit",
                  region: r,
                });
              }}
              onDelete={handleDeleteRegion}
            />
          ))}
        </div>
      )}

      <RegionFormDialog />
    </div>
  );
}
