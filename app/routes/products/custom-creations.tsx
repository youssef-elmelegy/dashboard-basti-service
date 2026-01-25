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
import { SmallCakeCard } from "@/components/SmallCakeCard";
import { AddSmallCakeForm } from "@/components/AddSmallCakeForm";
import { EditSmallCakeForm } from "@/components/EditSmallCakeForm";
import { ProductFilter } from "@/components/ProductFilter";
import { useSmallCakeStore } from "@/stores/smallCakeStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { SmallCake } from "@/data/products";
import { Plus } from "lucide-react";

export default function BigCakesPage() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCake, setEditingCake] = useState<SmallCake | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const cakes = useSmallCakeStore((state) => state.smallCakes);
  const addSmallCake = useSmallCakeStore((state) => state.addSmallCake);
  const updateSmallCake = useSmallCakeStore((state) => state.updateSmallCake);
  const deleteSmallCake = useSmallCakeStore((state) => state.deleteSmallCake);
  const toggleCakeActive = useSmallCakeStore((state) => state.toggleCakeActive);
  const { openDeleteDialog } = useDeleteDialog();

  // Get all unique tags from cakes
  const allTags = Array.from(new Set(cakes.flatMap((c) => c.tags))).sort();

  // Filter cakes based on selected filters
  const filteredCakes = cakes.filter((cake) => {
    // Filter by active status
    if (activeFilter === "active" && !cake.isActive) return false;
    if (activeFilter === "inactive" && cake.isActive) return false;

    // Filter by tags (if any selected, show products that have at least one matching tag)
    if (selectedTags.length > 0) {
      return selectedTags.some((tag) => cake.tags.includes(tag));
    }

    return true;
  });

  const handleAddCake = (values: Omit<SmallCake, "id" | "createdAt">) => {
    addSmallCake({
      id: Date.now().toString(),
      ...values,
      createdAt: new Date(),
    });
    setIsAddOpen(false);
  };

  const handleUpdateCake = (values: Omit<SmallCake, "createdAt">) => {
    if (editingCake) {
      updateSmallCake(editingCake.id, {
        ...editingCake,
        ...values,
      });
      setEditingCake(null);
    }
  };

  const handleDeleteCake = (cake: SmallCake) => {
    openDeleteDialog(
      {
        recordName: cake.name,
        recordType: t("largeCakes.recordType"),
        title: t("largeCakes.deleteCake"),
        description: `${t("messages.confirmDelete")}`,
      },
      () => deleteSmallCake(cake.id)
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("largeCakes.title")}
          </h1>
          <p className="text-muted-foreground">{t("largeCakes.description")}</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t("largeCakes.addCake")}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-muted/50 p-4 rounded-lg border">
        <ProductFilter
          availableTags={allTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
        />
      </div>

      {filteredCakes.length === 0 ? (
        <div className="flex-1">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>
                {cakes.length === 0
                  ? t("largeCakes.noCakesYet")
                  : t("largeCakes.noCakesMatch")}
              </EmptyTitle>
              <EmptyDescription>
                {cakes.length === 0
                  ? t("largeCakes.addFirstCake")
                  : t("largeCakes.tryAdjusting")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCakes.map((cake) => (
            <SmallCakeCard
              key={cake.id}
              cake={cake}
              onEdit={(c) => setEditingCake(c)}
              onDelete={handleDeleteCake}
              onToggleActive={toggleCakeActive}
            />
          ))}
        </div>
      )}

      {/* Add Cake Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="overflow-y-auto max-w-2xl">
          <SheetHeader>
            <SheetTitle>{t("largeCakes.addNewCake")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <AddSmallCakeForm onSubmit={handleAddCake} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Cake Sheet */}
      {editingCake && (
        <Sheet open={!!editingCake} onOpenChange={() => setEditingCake(null)}>
          <SheetContent className="overflow-y-auto max-w-2xl">
            <SheetHeader>
              <SheetTitle>{t("largeCakes.editCake")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <EditSmallCakeForm
                cake={editingCake}
                onSubmit={handleUpdateCake}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
