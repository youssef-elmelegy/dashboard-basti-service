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
import { AddOnCard } from "@/components/AddOnCard";
import { AddOnForm } from "@/components/AddOnForm";
import { ProductFilter } from "@/components/ProductFilter";
import { useAddOnStore } from "@/stores/addOnStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { AddOn } from "@/data/products";
import type {
  CreateAddOnRequest,
  UpdateAddOnRequest,
} from "@/lib/services/addOn.service";
import { Plus } from "lucide-react";

export default function AddOnsPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const addOns = useAddOnStore((state) => state.addOns);
  const isLoading = useAddOnStore((state) => state.isLoading);
  const error = useAddOnStore((state) => state.error);
  const fetchAddOns = useAddOnStore((state) => state.fetchAddOns);
  const addAddOn = useAddOnStore((state) => state.addAddOn);
  const updateAddOn = useAddOnStore((state) => state.updateAddOn);
  const deleteAddOn = useAddOnStore((state) => state.deleteAddOn);
  const toggleAddOnActive = useAddOnStore((state) => state.toggleAddOnActive);
  const { openDeleteDialog } = useDeleteDialog();

  // Fetch add-ons on mount
  useEffect(() => {
    fetchAddOns();
  }, [fetchAddOns]);

  // Filter add-ons based on selected filters
  const filteredAddOns = addOns.filter((addOn) => {
    // Filter by active status
    if (activeFilter === "active" && !addOn.isActive) return false;
    if (activeFilter === "inactive" && addOn.isActive) return false;

    return true;
  });

  const handleSubmitAddOn = async (
    formData: CreateAddOnRequest | UpdateAddOnRequest,
  ) => {
    console.log("handleSubmitAddOn called with formData:", formData);
    try {
      if (editingAddOn) {
        console.log("Updating add-on...");
        await updateAddOn(editingAddOn.id, formData as UpdateAddOnRequest);
        console.log("updateAddOn completed successfully");
        setEditingAddOn(null);
      } else {
        console.log("Creating add-on...");
        await addAddOn(formData as CreateAddOnRequest);
        console.log("addAddOn completed successfully");
      }
      setIsAddOpen(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : editingAddOn
            ? "Failed to update add-on"
            : "Failed to create add-on";
      console.error(errorMsg, err);
    }
  };

  const handleDeleteAddOn = (addOn: AddOn) => {
    openDeleteDialog(
      {
        title: t("addOns.deleteAddOn"),
        description: `${t("addOns.deleteMessage")} ${addOn.name}? ${t("common.cannotBeUndone")}`,
        recordType: t("addOns.recordType"),
        recordName: addOn.name,
      },
      async () => {
        try {
          await deleteAddOn(addOn.id);
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to delete add-on";
          console.error("Failed to delete add-on:", errorMsg, err);
        }
      },
    );
  };

  const handleEditAddOn = (addOn: AddOn) => {
    setEditingAddOn(addOn);
    setIsAddOpen(true);
  };

  const handleToggleAddOn = async (id: string) => {
    try {
      await toggleAddOnActive(id);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to toggle add-on status";
      console.error("Failed to toggle add-on status:", errorMsg, err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("addOns.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("addOns.description")}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAddOn(null);
            setIsAddOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("addOns.addNewAddOn")}
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
            onClick={() => fetchAddOns()}
            disabled={isLoading}
          >
            {isLoading ? t("common.loading") : t("common.retry")}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredAddOns.length === 0 ? (
        <Empty>
          <EmptyHeader>{t("addOns.noAddOnsFound")}</EmptyHeader>
          <EmptyTitle>{t("addOns.getStarted")}</EmptyTitle>
          <EmptyDescription>{t("addOns.createAddOns")}</EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddOns.map((addOn) => (
            <AddOnCard
              key={addOn.id}
              addOn={addOn}
              onEdit={handleEditAddOn}
              onDelete={handleDeleteAddOn}
              onToggleActive={() => handleToggleAddOn(addOn.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto max-w-2xl py-6">
          <SheetHeader>
            <SheetTitle>
              {editingAddOn ? t("addOns.editAddOn") : t("addOns.addNewAddOn")}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <AddOnForm
              initialAddOn={editingAddOn || undefined}
              onSubmit={handleSubmitAddOn}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
