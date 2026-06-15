import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search, UserX, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DriverAvatar from "@/components/DriverAvatar";
import { useDispatchStore } from "@/stores/dispatchStore";
import { driverService, type Driver } from "@/lib/services/driver.service";
import type { DispatchOrder } from "@/lib/services/order.service";

interface AssignDriverDialogProps {
  order: DispatchOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sheet for assigning a delivery driver to an order. Lists active (non-blocked)
 * drivers from the order's region; selecting one assigns it. If the order
 * already has a driver, an "Unassign" action is offered.
 */
export default function AssignDriverDialog({
  order,
  open,
  onOpenChange,
}: AssignDriverDialogProps) {
  const { t } = useTranslation();
  const assignDriver = useDispatchStore((s) => s.assignDriver);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const regionId = order?.regionId;

  // Reset transient state whenever the sheet opens for a new order.
  useEffect(() => {
    if (open) {
      setSearch("");
      setDebouncedSearch("");
      setError(null);
    }
  }, [open, order?.id]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  // Load region drivers (active only) whenever the sheet is open for a region.
  useEffect(() => {
    if (!open || !regionId) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const page = await driverService.getByRegion(regionId, {
          isBlocked: false,
          q: debouncedSearch || undefined,
          limit: 50,
        });
        if (!cancelled) setDrivers(page.items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("dispatch.driversLoadError"),
          );
          setDrivers([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, regionId, debouncedSearch, t]);

  const handleAssign = async (driver: Driver) => {
    if (!order) return;
    setSubmittingId(driver.id);
    setError(null);
    try {
      await assignDriver(order.id, driver.id, driver.name ?? driver.email);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dispatch.assignError"));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleUnassign = async () => {
    if (!order) return;
    setSubmittingId("__unassign__");
    setError(null);
    try {
      await assignDriver(order.id, null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dispatch.assignError"));
    } finally {
      setSubmittingId(null);
    }
  };

  const currentDriverName =
    order?.driverData?.name ?? order?.assignedDriverName ?? null;
  const submitting = submittingId !== null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {t("dispatch.assignDriver")}
            {order ? ` · #${order.referenceNumber}` : ""}
          </SheetTitle>
          <SheetDescription>
            {order?.regionName
              ? t("dispatch.assignDriverDesc", { region: order.regionName })
              : t("dispatch.assignDriver")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Current assignment */}
          <div className="text-sm text-muted-foreground">
            {t("dispatch.currently")}:{" "}
            <span className="font-medium text-foreground">
              {currentDriverName ?? t("dispatch.unassigned")}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dispatch.searchDrivers")}
              className="ps-8"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Driver list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t("dispatch.noDrivers")}
            </p>
          ) : (
            <ul className="space-y-1">
              {drivers.map((driver) => {
                const isCurrent = driver.id === order?.driverId;
                return (
                  <li key={driver.id}>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleAssign(driver)}
                      className="w-full flex items-center justify-between gap-3 rounded-md border border-border p-3 text-start hover:bg-muted transition disabled:opacity-50"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <DriverAvatar
                          name={driver.name}
                          image={driver.profileImage}
                          className="shrink-0"
                        />
                        <span className="flex flex-col min-w-0">
                          <span className="font-medium truncate">
                            {driver.name || driver.email}
                          </span>
                          {driver.phoneNumber && (
                            <span className="text-xs text-muted-foreground truncate">
                              {driver.phoneNumber}
                            </span>
                          )}
                        </span>
                      </span>
                      {submittingId === driver.id ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : isCurrent ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="flex-row gap-2">
          {order?.driverId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleUnassign}
              disabled={submitting}
              className="gap-2 text-destructive"
            >
              {submittingId === "__unassign__" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserX className="w-4 h-4" />
              )}
              {t("dispatch.unassign")}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("common.close")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
