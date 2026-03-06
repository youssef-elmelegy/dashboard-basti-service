import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useDeleteDialogStore } from "@/stores/deleteDialogStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

export function DeleteDialogProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { open, config, isLoading, closeDeleteDialog, confirmDelete } =
    useDeleteDialogStore();

  return (
    <>
      {children}
      <Sheet open={open} onOpenChange={closeDeleteDialog}>
        <SheetContent
          side="bottom"
          dir={i18n.language === "ar" ? "rtl" : "ltr"}
          className="w-full sm:max-w-md mx-auto pt-6"
          style={
            i18n.language === "ar"
              ? ({ direction: "rtl" } as React.CSSProperties)
              : {}
          }
        >
          {i18n.language === "ar" && (
            <style>{`
              [dir="rtl"] .sheet-close {
                left: 1rem !important;
                right: auto !important;
              }
            `}</style>
          )}
          <SheetHeader>
            <SheetTitle>
              {config?.title || `Delete ${config?.recordType}?`}
            </SheetTitle>
            <SheetDescription>
              {config?.description || (
                <>
                  Are you sure you want to delete{" "}
                  <strong>{config?.recordName}</strong>? This action cannot be
                  undone.
                </>
              )}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading
                ? config?.actionType === "block"
                  ? t("common.blocking")
                  : config?.actionType === "unblock"
                    ? t("common.unblocking")
                    : t("common.deleting")
                : config?.actionType === "block"
                  ? t("common.block")
                  : config?.actionType === "unblock"
                    ? t("common.unblock")
                    : t("common.delete")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
