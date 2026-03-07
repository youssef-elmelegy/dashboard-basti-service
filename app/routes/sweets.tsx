import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { SweetCard } from "@/components/SweetCard";
import { SweetForm, type SweetFormValues } from "@/components/SweetForm";
import { ProductFilter } from "@/components/ProductFilter";
import { useSweetStore } from "@/stores/sweetStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Sweet } from "@/lib/services/sweet.service";
import { Plus } from "lucide-react";

export default function SweetsPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSweet, setEditingSweet] = useState<Sweet | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const sweets = useSweetStore((state) => state.sweets);
  const isLoading = useSweetStore((state) => state.isLoading);
  const error = useSweetStore((state) => state.error);
  const fetchSweets = useSweetStore((state) => state.fetchSweets);
  const addSweet = useSweetStore((state) => state.addSweet);
  const updateSweet = useSweetStore((state) => state.updateSweet);
  const deleteSweet = useSweetStore((state) => state.deleteSweet);
  const toggleSweetStatus = useSweetStore((state) => state.toggleSweetStatus);
  const { openDeleteDialog } = useDeleteDialog();

  // Fetch sweets on mount
  useEffect(() => {
    fetchSweets();
  }, [fetchSweets]);

  // Filter sweets based on selected filters
  const filteredSweets = sweets.filter((sweet) => {
    // Filter by active status
    if (activeFilter === "active" && !sweet.isActive) return false;
    if (activeFilter === "inactive" && sweet.isActive) return false;

    return true;
  });

  const handleAddSweet = async (formData: SweetFormValues) => {
    console.log("handleAddSweet called with formData:", formData);
    try {
      console.log("Calling addSweet...");
      await addSweet(formData);
      console.log("addSweet completed successfully");
      setIsAddOpen(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create sweet";
      console.error("Failed to create sweet:", errorMsg, err);
    }
  };

  const handleUpdateSweet = async (formData: SweetFormValues) => {
    if (editingSweet) {
      try {
        await updateSweet(editingSweet.id, formData);
        setEditingSweet(null);
        setIsAddOpen(false);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update sweet";
        console.error("Failed to update sweet:", errorMsg, err);
      }
    }
  };

  const handleDeleteSweet = (sweet: Sweet) => {
    openDeleteDialog(
      {
        title: t("sweets.deleteSweet"),
        description: `${t("messages.confirmDelete")}`,
        recordType: t("sweets.recordType"),
        recordName: sweet.name,
      },
      async () => {
        try {
          await deleteSweet(sweet.id);
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to delete sweet";
          console.error("Failed to delete sweet:", errorMsg, err);
        }
      },
    );
  };

  const handleEditSweet = (sweet: Sweet) => {
    setEditingSweet(sweet);
    setIsAddOpen(true);
  };

  const handleToggleSweet = async (id: string) => {
    try {
      await toggleSweetStatus(id);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to toggle sweet status";
      console.error("Failed to toggle sweet status:", errorMsg, err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("sweets.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("sweets.description")}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSweet(null);
            setIsAddOpen(true);
          }}
          className="gap-2"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          {isLoading ? t("common.loading") : t("sweets.addNewSweet")}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-muted/50 p-4 rounded-lg border">
        <ProductFilter
          activeFilter={activeFilter}
          onActiveFilterChange={(filter) => setActiveFilter(filter)}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchSweets()}
            disabled={isLoading}
          >
            {isLoading ? t("common.loading") : t("common.retry")}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredSweets.length === 0 ? (
        <Empty>
          <EmptyHeader>{t("sweets.noSweetsFound")}</EmptyHeader>
          <EmptyTitle>{t("sweets.getStarted")}</EmptyTitle>
          <EmptyDescription>{t("sweets.createSweets")}</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSweets.map((sweet) => (
            <SweetCard
              key={sweet.id}
              sweet={sweet}
              onEdit={handleEditSweet}
              onDelete={handleDeleteSweet}
              onToggleActive={() => handleToggleSweet(sweet.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto max-w-2xl py-6">
          <SheetHeader>
            <SheetTitle>
              {editingSweet ? t("sweets.editSweet") : t("sweets.addNewSweet")}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SweetForm
              initialSweet={editingSweet || undefined}
              onSubmit={editingSweet ? handleUpdateSweet : handleAddSweet}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
