import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { debugAuth, debugRequest } from "@/lib/debug";
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
import AddChef from "@/components/AddChef";
import EditChef from "@/components/EditChef";
import { useChefStore } from "@/stores/chefStore";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Chef } from "@/lib/services/chef.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Edit2 } from "lucide-react";

export default function ChefsPage() {
  const { t } = useTranslation();
  const chefs = useChefStore((state) => state.chefs);
  const isLoading = useChefStore((state) => state.isLoading);
  const error = useChefStore((state) => state.error);
  const fetchChefs = useChefStore((state) => state.fetchChefs);
  const addChef = useChefStore((state) => state.addChef);
  const updateChef = useChefStore((state) => state.updateChef);
  const deleteChef = useChefStore((state) => state.deleteChef);
  const clearError = useChefStore((state) => state.clearError);

  const bakeries = useBakeryStore((state) => state.bakeries);
  const fetchBakeries = useBakeryStore((state) => state.fetchBakeries);
  const { openDeleteDialog } = useDeleteDialog();

  const [selectedBakery, setSelectedBakery] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingChef, setEditingChef] = useState<Chef | null>(null);

  // Fetch chefs and bakeries on mount
  useEffect(() => {
    console.log("ChefsPage: Mounting, fetching chefs and bakeries...");
    fetchChefs();
    fetchBakeries();
  }, [fetchChefs, fetchBakeries]);

  // Filter chefs by bakery
  const filteredChefs = useMemo(() => {
    if (selectedBakery === "all") {
      return chefs;
    }
    return chefs.filter((chef) => chef.bakeryId === selectedBakery);
  }, [chefs, selectedBakery]);

  const handleEditChef = (chef: Chef) => {
    setEditingChef(chef);
    setIsEditOpen(true);
  };

  const handleDeleteChef = (chef: Chef) => {
    openDeleteDialog(
      {
        recordName: chef.name,
        recordType: t("chefs.recordType"),
      },
      async () => {
        try {
          await deleteChef(chef.id);
        } catch (error) {
          console.error("Failed to delete chef:", error);
        }
      },
    );
  };

  const handleAddChef = async (formData: {
    name: string;
    specialization: string;
    bio?: string;
    image?: string;
    bakeryId: string;
  }) => {
    try {
      // Debug: Check auth before making request
      console.log("Before adding chef:");
      console.log("Form data:", formData);
      console.log("BakeryId:", formData.bakeryId);
      console.log("BakeryId type:", typeof formData.bakeryId);
      debugAuth();
      debugRequest("POST", "/api/chefs");

      await addChef({
        name: formData.name,
        specialization: formData.specialization,
        bio: formData.bio || undefined,
        image: formData.image || undefined,
        bakeryId: formData.bakeryId,
      });
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to add chef:", error);
    }
  };

  const handleUpdateChef = async (
    data: Omit<Chef, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (editingChef) {
      try {
        await updateChef(editingChef.id, {
          name: data.name,
          specialization: data.specialization,
          bio: data.bio || undefined,
          image: data.image || undefined,
          bakeryId: data.bakeryId,
        });
        setIsEditOpen(false);
        setEditingChef(null);
      } catch (error) {
        console.error("Failed to update chef:", error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/management/regions">
                {t("chefs.breadcrumbRegions")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/management/bakeries">
                {t("chefs.breadcrumbBakeries")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("chefs.breadcrumbChefs")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("chefs.title")}</h1>
          <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
            <SheetTrigger asChild>
              <Button
                className="gap-2"
                disabled={isLoading || bakeries.length === 0}
                title={
                  bakeries.length === 0 ? "Load bakeries first" : "Add chef"
                }
              >
                <Plus className="w-4 h-4" />
                {t("chefs.addChef")}
              </Button>
            </SheetTrigger>
            <AddChef onSubmit={handleAddChef} />
          </Sheet>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
      {isLoading && chefs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      ) : filteredChefs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-3xl">👨‍🍳</span>
            </EmptyMedia>
            <EmptyTitle>{t("chefs.noChefs")}</EmptyTitle>
            <EmptyDescription>{t("chefs.startCreating")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("chefs.createChef")}
                </Button>
              </SheetTrigger>
              <AddChef onSubmit={handleAddChef} />
            </Sheet>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {/* Filter */}
          {bakeries.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={selectedBakery === "all" ? "default" : "outline"}
                onClick={() => setSelectedBakery("all")}
              >
                All Bakeries
              </Button>
              {bakeries.map((bakery) => (
                <Button
                  key={bakery.id}
                  variant={selectedBakery === bakery.id ? "default" : "outline"}
                  onClick={() => setSelectedBakery(bakery.id)}
                >
                  {bakery.name}
                </Button>
              ))}
            </div>
          )}

          {/* Chefs Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Bakery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChefs.map((chef) => {
                  const bakery = bakeries.find((b) => b.id === chef.bakeryId);
                  return (
                    <TableRow key={chef.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {chef.image ? (
                            <img
                              src={chef.image}
                              alt={chef.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium flex-shrink-0">
                              {chef.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{chef.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{chef.specialization}</TableCell>
                      <TableCell>{bakery?.name || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditChef(chef)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteChef(chef)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        {editingChef && (
          <EditChef chef={editingChef} onSubmit={handleUpdateChef} />
        )}
      </Sheet>
    </div>
  );
}
