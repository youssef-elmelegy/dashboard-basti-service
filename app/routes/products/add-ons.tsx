import { useState } from "react";
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
import { Plus } from "lucide-react";

export default function AddOnsPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const addOns = useAddOnStore((state) => state.addOns);
  const addAddOn = useAddOnStore((state) => state.addAddOn);
  const updateAddOn = useAddOnStore((state) => state.updateAddOn);
  const deleteAddOn = useAddOnStore((state) => state.deleteAddOn);
  const toggleAddOnActive = useAddOnStore((state) => state.toggleAddOnActive);
  const { openDeleteDialog } = useDeleteDialog();

  // Get all unique tags from add-ons
  const allTags = Array.from(new Set(addOns.flatMap((a) => a.tags))).sort();

  // Filter add-ons based on selected filters
  const filteredAddOns = addOns.filter((addOn) => {
    // Filter by active status
    if (activeFilter === "active" && !addOn.isActive) return false;
    if (activeFilter === "inactive" && addOn.isActive) return false;

    // Filter by tags (if any selected, show products that have at least one matching tag)
    if (selectedTags.length > 0) {
      return selectedTags.some((tag) => addOn.tags.includes(tag));
    }
    return true;
  });

  const handleAddAddOn = (formData: Omit<AddOn, "id">) => {
    const newAddOn: AddOn = {
      id: `addon-${Date.now()}`,
      ...formData,
    };
    addAddOn(newAddOn);
    setIsAddOpen(false);
  };

  const handleEditAddOn = (addOn: AddOn) => {
    setEditingAddOn(addOn);
    setIsAddOpen(true);
  };

  const handleUpdateAddOn = (formData: Omit<AddOn, "id">) => {
    if (editingAddOn) {
      updateAddOn(editingAddOn.id, formData);
      setEditingAddOn(null);
      setIsAddOpen(false);
    }
  };

  const handleDeleteAddOn = (addOn: AddOn) => {
    openDeleteDialog(
      {
        title: t("addOns.deleteAddOn"),
        description: `${t("messages.confirmDelete")}`,
        recordType: t("addOns.recordType"),
        recordName: addOn.name,
      },
      () => deleteAddOn(addOn.id)
    );
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
      <ProductFilter
        availableTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={(tag) => {
          setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
          );
        }}
        activeFilter={activeFilter}
        onActiveFilterChange={(filter) => setActiveFilter(filter)}
      />

      {/* Empty State */}
      {filteredAddOns.length === 0 ? (
        <Empty>
          <EmptyHeader>{t("addOns.noAddOnsFound")}</EmptyHeader>
          <EmptyTitle>{t("addOns.getStarted")}</EmptyTitle>
          <EmptyDescription>{t("addOns.createAddOns")}</EmptyDescription>
        </Empty>
      ) : (
        /* Add-ons Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddOns.map((addOn) => (
            <AddOnCard
              key={addOn.id}
              addOn={addOn}
              onEdit={handleEditAddOn}
              onDelete={handleDeleteAddOn}
              onToggleActive={toggleAddOnActive}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingAddOn ? t("addOns.editAddOn") : t("addOns.addNewAddOn")}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <AddOnForm
              initialAddOn={editingAddOn || undefined}
              onSubmit={editingAddOn ? handleUpdateAddOn : handleAddAddOn}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
