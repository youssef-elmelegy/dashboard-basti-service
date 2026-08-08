import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Lock,
  LockOpen,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AddDriver from "@/components/AddDriver";
import { useCan } from "@/hooks/useAuth";
import EditDriver from "@/components/EditDriver";
import { useDriverStore } from "@/stores/driverStore";
import { useRegionStore } from "@/stores/regionStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type {
  Driver,
  CreateDriverPayload,
  UpdateDriverPayload,
} from "@/lib/services/driver.service";

const LIMIT = 10;

export default function RegionDriversPage() {
  const { id: regionId = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const drivers = useDriverStore((s) => s.drivers);
  const pagination = useDriverStore((s) => s.listPagination);
  const isLoading = useDriverStore((s) => s.isListLoading);
  const error = useDriverStore((s) => s.error);
  const fetchRegionDrivers = useDriverStore((s) => s.fetchRegionDrivers);
  const createDriver = useDriverStore((s) => s.createDriver);
  const updateDriver = useDriverStore((s) => s.updateDriver);
  const blockDriver = useDriverStore((s) => s.blockDriver);
  const deleteDriver = useDriverStore((s) => s.deleteDriver);
  const clearError = useDriverStore((s) => s.clearError);

  const currentRegion = useRegionStore((s) => s.currentRegion);
  const fetchRegionById = useRegionStore((s) => s.fetchRegionById);

  const { openDeleteDialog } = useDeleteDialog();
  const canWriteDrivers = useCan("writeDrivers");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  useEffect(() => {
    if (regionId) {
      fetchRegionById(regionId).catch((e) =>
        console.error("Failed to fetch region:", e),
      );
    }
  }, [regionId, fetchRegionById]);

  const reload = () => {
    if (regionId) {
      fetchRegionDrivers(regionId, { page, limit: LIMIT, q: appliedQuery });
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId, page, appliedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedQuery(search.trim());
  };

  const handleAddDriver = async (data: CreateDriverPayload) => {
    await createDriver(data);
    setIsAddOpen(false);
    setPage(1);
    fetchRegionDrivers(regionId, { page: 1, limit: LIMIT, q: appliedQuery });
  };

  const handleUpdateDriver = async (data: UpdateDriverPayload) => {
    if (!editingDriver) return;
    await updateDriver(editingDriver.id, data);
    setIsEditOpen(false);
    setEditingDriver(null);
    reload();
  };

  const handleBlock = (driver: Driver) => {
    const isBlocking = !driver.isBlocked;
    openDeleteDialog(
      {
        recordName: driver.name || driver.email,
        recordType: isBlocking ? t("drivers.blockConfirm") : t("drivers.unblockConfirm"),
        title: isBlocking ? t("drivers.blockConfirm") : t("drivers.unblockConfirm"),
        description: `${isBlocking ? t("drivers.blockMessage") : t("drivers.unblockMessage")} ${
          driver.name || driver.email
        }?`,
        actionType: isBlocking ? "block" : "unblock",
      },
      async () => {
        try {
          await blockDriver(driver.id, isBlocking);
        } catch (e) {
          console.error("Failed to block/unblock driver:", e);
        }
      },
    );
  };

  const handleDelete = (driver: Driver) => {
    openDeleteDialog(
      {
        recordName: driver.name || driver.email,
        recordType: t("drivers.recordType"),
        title: t("drivers.deleteConfirm"),
        description: `${t("drivers.deleteMessage")} ${driver.name || driver.email}? ${t(
          "common.cannotBeUndone",
        )}`,
        actionType: "delete",
      },
      async () => {
        try {
          await deleteDriver(driver.id);
        } catch (e) {
          console.error("Failed to delete driver:", e);
        }
      },
    );
  };

  const openDriver = (driver: Driver) =>
    navigate(`/management/regions/${regionId}/drivers/${driver.id}`);

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setIsEditOpen(true);
  };

  // Driver reads are open to admin, but every mutation (create/edit/block/
  // delete) is super_admin-only server-side — so the row actions collapse to
  // nothing rather than offering buttons that would come back 403.
  const actionButtons = (driver: Driver) => {
    if (!canWriteDrivers) return null;
    return (
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => handleEdit(driver)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={t("drivers.editDriver")}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleBlock(driver)}
          className={`p-2 rounded-lg transition-colors ${
            driver.isBlocked ? "hover:bg-green-100" : "hover:bg-red-100"
          }`}
          title={driver.isBlocked ? t("drivers.unblock") : t("drivers.block")}
        >
          {driver.isBlocked ? (
            <LockOpen className="w-4 h-4 text-green-600" />
          ) : (
            <Lock className="w-4 h-4 text-red-600" />
          )}
        </button>
        <button
          onClick={() => handleDelete(driver)}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          title={t("drivers.deleteDriver")}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    );
  };

  const align = "text-start";

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/management/regions">
                {t("drivers.breadcrumbRegions")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/management/regions/${regionId}`}>
                {currentRegion?.name || t("drivers.breadcrumbRegion")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("drivers.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold">
            {t("drivers.title")}
            {currentRegion?.name ? ` — ${currentRegion.name}` : ""}
          </h1>
          {canWriteDrivers && (
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2" disabled={isLoading}>
                  <Plus className="w-4 h-4" />
                  {t("drivers.addDriver")}
                </Button>
              </SheetTrigger>
              <AddDriver regionId={regionId} onSubmit={handleAddDriver} />
            </Sheet>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("drivers.searchPlaceholder")}
          />
          <Button type="submit" variant="outline" className="gap-2">
            <Search className="w-4 h-4" />
            {t("drivers.search")}
          </Button>
        </form>
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

      {isLoading && drivers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      ) : drivers.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-3xl">🚚</span>
            </EmptyMedia>
            <EmptyTitle>{t("drivers.noDrivers")}</EmptyTitle>
            {/* "Start by creating one" is only true for someone who can. */}
            {canWriteDrivers && (
              <EmptyDescription>{t("drivers.startCreating")}</EmptyDescription>
            )}
          </EmptyHeader>
          {canWriteDrivers && (
            <EmptyContent>
              <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                <SheetTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t("drivers.createDriver")}
                  </Button>
                </SheetTrigger>
                <AddDriver regionId={regionId} onSubmit={handleAddDriver} />
              </Sheet>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className={align}>{t("driverTable.name")}</TableHead>
                  <TableHead className={align}>{t("driverTable.email")}</TableHead>
                  <TableHead className={align}>{t("driverTable.phone")}</TableHead>
                  <TableHead className={align}>{t("driverTable.dueAmount")}</TableHead>
                  <TableHead className={align}>{t("driverTable.status")}</TableHead>
                  {canWriteDrivers && (
                    <TableHead className="text-end">
                      {t("driverTable.actions")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id} className="cursor-pointer">
                    <TableCell onClick={() => openDriver(driver)}>
                      <Avatar key={driver.profileImage ?? driver.id} className="size-9">
                        {driver.profileImage && (
                          <AvatarImage
                            src={driver.profileImage}
                            alt={driver.name || driver.email}
                          />
                        )}
                        <AvatarFallback className="text-sm font-medium">
                          {(driver.name || driver.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell
                      className="font-medium hover:underline"
                      onClick={() => openDriver(driver)}
                    >
                      {driver.name || "—"}
                    </TableCell>
                    <TableCell onClick={() => openDriver(driver)}>{driver.email}</TableCell>
                    <TableCell onClick={() => openDriver(driver)}>
                      {driver.phoneNumber || "—"}
                    </TableCell>
                    <TableCell onClick={() => openDriver(driver)}>
                      {Number(driver.dueAmount ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell onClick={() => openDriver(driver)}>
                      <span
                        className={
                          driver.isBlocked ? "text-red-600" : "text-green-600"
                        }
                      >
                        {driver.isBlocked
                          ? t("driverTable.blocked")
                          : t("driverTable.active")}
                      </span>
                    </TableCell>
                    {canWriteDrivers && (
                      <TableCell className="text-end">
                        {actionButtons(driver)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("common.page")} {pagination.page} / {pagination.totalPages} (
              {pagination.total})
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                {t("common.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("common.next")}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        {editingDriver && (
          <EditDriver driver={editingDriver} onSubmit={handleUpdateDriver} />
        )}
      </Sheet>
    </div>
  );
}
