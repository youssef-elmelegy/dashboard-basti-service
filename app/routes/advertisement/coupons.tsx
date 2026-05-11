import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  BadgePercent,
  Bell,
} from "lucide-react";
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
import CouponForm from "@/components/CouponForm";
import { SendCouponNotificationDialog } from "@/components/SendCouponNotificationDialog";
import { useCouponStore } from "@/stores/couponStore";
import { useRegionStore } from "@/stores/regionStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type {
  Coupon,
  GenerateCouponPayload,
} from "@/lib/services/coupon.service";

export default function CouponsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const coupons = useCouponStore((s) => s.coupons);
  const isLoading = useCouponStore((s) => s.isLoading);
  const isSaving = useCouponStore((s) => s.isSaving);
  const error = useCouponStore((s) => s.error);
  const fetchCoupons = useCouponStore((s) => s.fetchCoupons);
  const createCoupon = useCouponStore((s) => s.createCoupon);
  const updateCoupon = useCouponStore((s) => s.updateCoupon);
  const toggleCouponStatus = useCouponStore((s) => s.toggleCouponStatus);
  const deleteCoupon = useCouponStore((s) => s.deleteCoupon);
  const clearError = useCouponStore((s) => s.clearError);

  const regions = useRegionStore((s) => s.regions);
  const fetchRegions = useRegionStore((s) => s.fetchRegions);

  const { openDeleteDialog } = useDeleteDialog();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [notifyingCoupon, setNotifyingCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    fetchCoupons();
    fetchRegions();
  }, [fetchCoupons, fetchRegions]);

  const handleAdd = async (payload: GenerateCouponPayload) => {
    const created = await createCoupon(payload);
    if (created) {
      setIsAddOpen(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsEditOpen(true);
  };

  const handleUpdate = async (payload: GenerateCouponPayload) => {
    if (!editingCoupon) return;
    const updated = await updateCoupon(editingCoupon.id, payload);
    if (updated) {
      setIsEditOpen(false);
      setEditingCoupon(null);
    }
  };

  const handleToggle = (coupon: Coupon) => {
    toggleCouponStatus(coupon.id).catch((err) =>
      console.error("Failed to toggle coupon status:", err),
    );
  };

  const handleDelete = (coupon: Coupon) => {
    openDeleteDialog(
      {
        title: t("coupons.deleteTitle"),
        description: (
          <>
            {t("coupons.deleteMessage")} <strong>{coupon.code}</strong>?{" "}
            {t("common.cannotBeUndone")}
          </>
        ),
        recordName: coupon.code,
        recordType: t("coupons.recordType"),
      },
      async () => {
        try {
          await deleteCoupon(coupon.id);
        } catch (err) {
          console.error("Failed to delete coupon:", err);
        }
      },
    );
  };

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US");
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "free_shipping") {
      return t("coupons.discountTypeLabels.free_shipping");
    }
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }
    return `${coupon.discountValue} ${t("common.currency")}`;
  };

  const regionName = (coupon: Coupon) => {
    if (coupon.isGlobal) return t("coupons.global");
    if (!coupon.regionId) return "—";
    return regions.find((r) => r.id === coupon.regionId)?.name ?? "—";
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("coupons.title")}</h1>
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2" disabled={isLoading}>
              <Plus className="w-4 h-4" />
              {t("coupons.addCoupon")}
            </Button>
          </SheetTrigger>
          <CouponForm
            mode="add"
            isSaving={isSaving}
            onSubmit={handleAdd}
          />
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

      {isLoading && coupons.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      ) : coupons.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BadgePercent className="w-8 h-8" />
            </EmptyMedia>
            <EmptyTitle>{t("coupons.noCoupons")}</EmptyTitle>
            <EmptyDescription>{t("coupons.startCreating")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("coupons.createCoupon")}
                </Button>
              </SheetTrigger>
              <CouponForm
                mode="add"
                isSaving={isSaving}
                onSubmit={handleAdd}
              />
            </Sheet>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("coupons.code")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("coupons.name")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("coupons.discount")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("coupons.region")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("coupons.expiryDate")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("coupons.usage")}
                </TableHead>
                <TableHead className={isRTL ? "text-right" : "text-left"}>
                  {t("coupons.status")}
                </TableHead>
                <TableHead className={isRTL ? "text-left" : "text-right"}>
                  {t("coupons.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-medium">
                    {coupon.code}
                  </TableCell>
                  <TableCell>{coupon.name}</TableCell>
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell>{regionName(coupon)}</TableCell>
                  <TableCell>{formatDate(coupon.expiryDate)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.usageLimitGlobal === 0
                      ? t("coupons.unlimited")
                      : coupon.usageLimitGlobal}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={coupon.isActive ? "default" : "secondary"}
                    >
                      {coupon.isActive
                        ? t("common.active")
                        : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={isRTL ? "text-left" : "text-right"}
                  >
                    <div
                      className={`flex gap-2 ${isRTL ? "justify-start" : "justify-end"}`}
                    >
                      <button
                        type="button"
                        onClick={() => setNotifyingCoupon(coupon)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors dark:hover:bg-blue-900/30"
                        title={t("coupons.notification.action")}
                      >
                        <Bell className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(coupon)}
                        className={`p-2 rounded-lg transition-colors ${
                          coupon.isActive
                            ? "hover:bg-orange-100"
                            : "hover:bg-green-100"
                        }`}
                        title={
                          coupon.isActive
                            ? t("common.deactivate")
                            : t("common.activate")
                        }
                      >
                        {coupon.isActive ? (
                          <PowerOff className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Power className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(coupon)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t("common.edit")}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon)}
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
        {editingCoupon && (
          <CouponForm
            mode="edit"
            initial={editingCoupon}
            isSaving={isSaving}
            onSubmit={handleUpdate}
          />
        )}
      </Sheet>

      <SendCouponNotificationDialog
        coupon={notifyingCoupon}
        open={notifyingCoupon !== null}
        onOpenChange={(open) => {
          if (!open) setNotifyingCoupon(null);
        }}
      />
    </div>
  );
}
