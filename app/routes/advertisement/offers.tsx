import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, AlertCircle, Loader2, Edit2, Trash2, Power, PowerOff, Tag, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OfferForm from "@/components/OfferForm";
import AssignOfferDialog from "@/components/AssignOfferDialog";
import { useOfferStore } from "@/stores/offerStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type { Offer, CreateOfferPayload, ToggleItemOfferPayload } from "@/lib/services/offer.service";

export default function OffersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const offers = useOfferStore((s) => s.offers);
  const isLoading = useOfferStore((s) => s.isLoading);
  const isSaving = useOfferStore((s) => s.isSaving);
  const error = useOfferStore((s) => s.error);
  const fetchOffers = useOfferStore((s) => s.fetchOffers);
  const createOffer = useOfferStore((s) => s.createOffer);
  const updateOffer = useOfferStore((s) => s.updateOffer);
  const toggleOfferStatus = useOfferStore((s) => s.toggleOfferStatus);
  const toggleItemOffer = useOfferStore((s) => s.toggleItemOffer);
  const deleteOffer = useOfferStore((s) => s.deleteOffer);
  const clearError = useOfferStore((s) => s.clearError);

  const { openDeleteDialog } = useDeleteDialog();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningOffer, setAssigningOffer] = useState<Offer | null>(null);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleAdd = async (payload: CreateOfferPayload) => {
    const created = await createOffer(payload);
    if (created) setIsAddOpen(false);
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setIsEditOpen(true);
  };

  const handleUpdate = async (payload: CreateOfferPayload) => {
    if (!editingOffer) return;
    const updated = await updateOffer(editingOffer.id, payload);
    if (updated) {
      setIsEditOpen(false);
      setEditingOffer(null);
    }
  };

  const handleToggle = (offer: Offer) => {
    toggleOfferStatus(offer.id);
  };

  const handleAssign = (offer: Offer) => {
    setAssigningOffer(offer);
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (payload: ToggleItemOfferPayload) => {
    await toggleItemOffer(payload);
    setIsAssignOpen(false);
    setAssigningOffer(null);
  };

  const handleDelete = (offer: Offer) => {
    openDeleteDialog(
      {
        title: t("offers.deleteTitle"),
        description: (
          <>
            {t("offers.deleteMessage")} <strong>{offer.name}</strong>?{" "}
            {t("common.cannotBeUndone")}
          </>
        ),
        recordName: offer.name,
        recordType: t("offers.recordType"),
      },
      async () => {
        await deleteOffer(offer.id);
      },
    );
  };

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US");
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("offers.title")}</h1>
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2" disabled={isLoading}>
              <Plus className="w-4 h-4" />
              {t("offers.addOffer")}
            </Button>
          </SheetTrigger>
          <OfferForm mode="add" isSaving={isSaving} onSubmit={handleAdd} />
        </Sheet>
      </div>

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

      {isLoading && offers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      ) : offers.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Tag className="w-8 h-8" />
            </EmptyMedia>
            <EmptyTitle>{t("offers.noOffers")}</EmptyTitle>
            <EmptyDescription>{t("offers.startCreating")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("offers.createOffer")}
                </Button>
              </SheetTrigger>
              <OfferForm mode="add" isSaving={isSaving} onSubmit={handleAdd} />
            </Sheet>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("offers.name")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("offers.percentage")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("offers.startDate")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("offers.expiryDate")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("offers.connectedItems")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("offers.status")}
                </TableHead>
                <TableHead className="text-end">
                  {t("offers.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.name}</TableCell>
                  <TableCell>{offer.percentage}%</TableCell>
                  <TableCell>{formatDate(offer.startDate)}</TableCell>
                  <TableCell>{formatDate(offer.expiryDate)}</TableCell>
                  <TableCell>
                    {offer.itemsCount > 0 ? (
                      <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {t("offers.itemsConnected", { count: offer.itemsCount })}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        {t("offers.notConnected")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={offer.isActive ? "default" : "secondary"}>
                      {offer.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleToggle(offer)}
                        className={`p-2 rounded-lg transition-colors ${
                          offer.isActive ? "hover:bg-orange-100" : "hover:bg-green-100"
                        }`}
                        title={offer.isActive ? t("common.deactivate") : t("common.activate")}
                      >
                        {offer.isActive ? (
                          <PowerOff className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Power className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssign(offer)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title={t("offers.assignToItem")}
                      >
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(offer)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t("common.edit")}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(offer)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title={t("common.delete")}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        {editingOffer && (
          <OfferForm
            mode="edit"
            initial={editingOffer}
            isSaving={isSaving}
            onSubmit={handleUpdate}
          />
        )}
      </Sheet>

      <AssignOfferDialog
        offer={assigningOffer}
        open={isAssignOpen}
        isSaving={isSaving}
        onOpenChange={setIsAssignOpen}
        onSubmit={handleAssignSubmit}
      />
    </div>
  );
}
