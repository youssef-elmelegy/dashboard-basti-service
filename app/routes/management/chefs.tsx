import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { columns } from "@/components/ChefsColumns";
import { ChefsDataTable } from "@/components/ChefsDataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import AddChef from "@/components/AddChef";
import EditChef from "@/components/EditChef";
import { useBakeryStore, useChefStore, type Chef } from "@/stores";
import { useDeleteDialog } from "@/components/useDeleteDialog";

export default function ChefsPage() {
  const { t } = useTranslation();
  const [selectedBakery, setSelectedBakery] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingChef, setEditingChef] = useState<Chef | null>(null);

  // Get data and actions from stores
  const chefs = useChefStore((state) => state.chefs);
  const addChef = useChefStore((state) => state.addChef);
  const updateChef = useChefStore((state) => state.updateChef);
  const deleteChef = useChefStore((state) => state.deleteChef);

  const bakeryNames = useBakeryStore((state) => state.bakeryNames);
  const { openDeleteDialog } = useDeleteDialog();

  // Memoize filtered data
  const filteredData = useMemo(() => {
    if (selectedBakery === "all") {
      return chefs;
    }
    return chefs.filter((chef) => chef.bakery === selectedBakery);
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
      () => {
        deleteChef(chef.id);
      }
    );
  };

  const handleAddChef = (formData: {
    name: string;
    bakery: string;
    image: string;
  }) => {
    const newChef: Chef = {
      id: `chef${Date.now()}`,
      name: formData.name,
      bakery: formData.bakery,
      image: formData.image,
      rating: 4.5,
    };
    addChef(newChef);
    setIsAddOpen(false);
  };

  const handleUpdateChef = (formData: {
    name: string;
    bakery: string;
    image: string;
  }) => {
    if (editingChef) {
      updateChef(editingChef.id, {
        name: formData.name,
        bakery: formData.bakery,
        image: formData.image,
      });
      setIsEditOpen(false);
      setEditingChef(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t("chefs.addChef")}
              </Button>
            </SheetTrigger>
            <AddChef bakeries={bakeryNames} onSubmit={handleAddChef} />
          </Sheet>
        </div>
      </div>

      <div className="bg-secondary rounded-md p-4 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t("chefs.allChefs")}</h2>
          <Select value={selectedBakery} onValueChange={setSelectedBakery}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("chefs.allBakeries")}</SelectItem>
              {bakeryNames.map((bakery) => (
                <SelectItem key={bakery} value={bakery}>
                  {bakery}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        {editingChef && (
          <EditChef
            chef={editingChef}
            bakeries={bakeryNames}
            onSubmit={handleUpdateChef}
          />
        )}
      </Sheet>

      <ChefsDataTable
        columns={columns(handleEditChef, handleDeleteChef)}
        data={filteredData}
      />
    </div>
  );
}
