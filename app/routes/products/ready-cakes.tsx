import { useState } from "react";
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
import { ReadyCakeCard } from "@/components/ReadyCakeCard";
import { AddReadyCakeForm } from "@/components/AddReadyCakeForm";
import { EditReadyCakeForm } from "@/components/EditReadyCakeForm";
import { ProductFilter } from "@/components/ProductFilter";
import { useReadyCakeStore } from "@/stores/readyCakeStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { ReadyCake } from "@/data/products";
import { Plus } from "lucide-react";

export default function ReadyCakesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCake, setEditingCake] = useState<ReadyCake | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const cakes = useReadyCakeStore((state) => state.readyCakes);
  const addReadyCake = useReadyCakeStore((state) => state.addReadyCake);
  const updateReadyCake = useReadyCakeStore((state) => state.updateReadyCake);
  const deleteReadyCake = useReadyCakeStore((state) => state.deleteReadyCake);
  const toggleCakeActive = useReadyCakeStore((state) => state.toggleCakeActive);
  const { openDeleteDialog } = useDeleteDialog();

  // Get all unique tags from ready cakes
  const allTags = Array.from(new Set(cakes.flatMap((c) => c.tags))).sort();

  // Filter ready cakes based on selected filters
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

  const handleAddCake = (values: Omit<ReadyCake, "id" | "createdAt">) => {
    addReadyCake({
      id: Date.now().toString(),
      ...values,
      createdAt: new Date(),
    });
    setIsAddOpen(false);
  };

  const handleUpdateCake = (values: Omit<ReadyCake, "createdAt">) => {
    if (editingCake) {
      updateReadyCake(editingCake.id, {
        ...editingCake,
        ...values,
      });
      setEditingCake(null);
    }
  };

  const handleDeleteCake = (cake: ReadyCake) => {
    openDeleteDialog(
      {
        recordName: cake.name,
        recordType: "cake",
        title: "Delete Cake",
        description: `Are you sure you want to delete "${cake.name}"? This action cannot be undone.`,
      },
      () => deleteReadyCake(cake.id)
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
          <h1 className="text-3xl font-bold tracking-tight">Ready Cakes</h1>
          <p className="text-muted-foreground">
            Manage your ready-made cake inventory
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Cake
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
                  ? "No ready cakes yet"
                  : "No ready cakes match your filters"}
              </EmptyTitle>
              <EmptyDescription>
                {cakes.length === 0
                  ? "Add your first ready-made cake to get started"
                  : "Try adjusting your filters to find products"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCakes.map((cake) => (
            <ReadyCakeCard
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
            <SheetTitle>Add New Cake</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <AddReadyCakeForm onSubmit={handleAddCake} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Cake Sheet */}
      {editingCake && (
        <Sheet open={!!editingCake} onOpenChange={() => setEditingCake(null)}>
          <SheetContent className="overflow-y-auto max-w-2xl">
            <SheetHeader>
              <SheetTitle>Edit Cake</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <EditReadyCakeForm
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
