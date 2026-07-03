import {
  Plus,
  AlertCircle,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
import AddAdmin from "@/components/AddAdmin";
import EditAdmin from "@/components/EditAdmin";
import { useAdminStore } from "@/stores/adminStore";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import type {
  Admin,
  CreateAdminPayload,
  UpdateAdminPayload,
  BlockAdminPayload,
} from "@/lib/services/admin.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit2, Lock, LockOpen } from "lucide-react";

export default function AdminsPage() {
  const { t } = useTranslation();
  const admins = useAdminStore((state) => state.admins);
  const pagination = useAdminStore((state) => state.pagination);
  const page = useAdminStore((state) => state.page);
  const isLoading = useAdminStore((state) => state.isLoading);
  const error = useAdminStore((state) => state.error);
  const fetchAdmins = useAdminStore((state) => state.fetchAdmins);
  const goToPage = useAdminStore((state) => state.goToPage);
  const addAdmin = useAdminStore((state) => state.addAdmin);
  const updateAdmin = useAdminStore((state) => state.updateAdmin);
  const blockAdmin = useAdminStore((state) => state.blockAdmin);
  const deleteAdmin = useAdminStore((state) => state.deleteAdmin);
  const clearError = useAdminStore((state) => state.clearError);

  const bakeries = useBakeryStore((state) => state.bakeries);
  const fetchBakeries = useBakeryStore((state) => state.fetchBakeries);
  const { openDeleteDialog } = useDeleteDialog();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  // Fetch admins and bakeries on mount
  useEffect(() => {
    console.log("AdminsPage: Mounting, fetching admins and bakeries...");
    fetchAdmins();
    fetchBakeries();
  }, [fetchAdmins, fetchBakeries]);

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setIsEditOpen(true);
  };

  const handleBlockAdmin = (admin: Admin) => {
    const blockPayload: BlockAdminPayload = {
      isBlocked: !admin.isBlocked,
    };

    const isBlocking = !admin.isBlocked;
    openDeleteDialog(
      {
        recordName: admin.email,
        recordType: admin.isBlocked
          ? t("admins.unblockConfirm")
          : t("admins.blockConfirm"),
        title: isBlocking
          ? t("admins.blockConfirm")
          : t("admins.unblockConfirm"),
        description: isBlocking
          ? `${t("admins.blockMessage")} ${admin.email}? ${t("common.cannotBeUndone")}`
          : `${t("admins.unblockMessage")} ${admin.email}? ${t("common.cannotBeUndone")}`,
        actionType: isBlocking ? "block" : "unblock",
      },
      async () => {
        try {
          await blockAdmin(admin.id, blockPayload);
        } catch (error) {
          console.error("Failed to block/unblock admin:", error);
        }
      },
    );
  };

  const handleDeleteAdmin = (admin: Admin) => {
    openDeleteDialog(
      {
        recordName: admin.email,
        recordType: t("admins.breadcrumbAdmins"),
        title: t("admins.deleteConfirm"),
        description: `${t("admins.deleteMessage")} ${admin.email}? ${t("common.cannotBeUndone")}`,
        actionType: "delete",
      },
      async () => {
        try {
          await deleteAdmin(admin.id);
        } catch (error) {
          console.error("Failed to delete admin:", error);
        }
      },
    );
  };

  const handleAddAdmin = async (formData: CreateAdminPayload) => {
    try {
      console.log("Adding admin:", formData);
      await addAdmin(formData);
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to add admin:", error);
    }
  };

  const handleUpdateAdmin = async (data: UpdateAdminPayload) => {
    if (editingAdmin) {
      try {
        await updateAdmin(editingAdmin.id, data);
        setIsEditOpen(false);
        setEditingAdmin(null);
      } catch (error) {
        console.error("Failed to update admin:", error);
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
                {t("admins.breadcrumbManagement")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("admins.breadcrumbAdmins")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("admins.title")}</h1>
          <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2" disabled={isLoading}>
                <Plus className="w-4 h-4" />
                {t("admins.addAdmin")}
              </Button>
            </SheetTrigger>
            <AddAdmin onSubmit={handleAddAdmin} />
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
      {isLoading && admins.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      ) : admins.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-3xl">👨‍💼</span>
            </EmptyMedia>
            <EmptyTitle>{t("admins.noAdmins")}</EmptyTitle>
            <EmptyDescription>{t("admins.startCreating")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("admins.createAdmin")}
                </Button>
              </SheetTrigger>
              <AddAdmin onSubmit={handleAddAdmin} />
            </Sheet>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {/* Admins Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="text-start">
                    {t("adminTable.email")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("adminTable.role")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("adminTable.bakery")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("adminTable.status")}
                  </TableHead>
                  <TableHead className="text-end">
                    {t("adminTable.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => {
                  const bakery = bakeries.find((b) => b.id === admin.bakeryId);
                  const roleKeyMap: Record<typeof admin.role, string> = {
                    super_admin: "adminTable.superAdmin",
                    admin: "adminTable.admin",
                    manager: "adminTable.manager",
                    driver: "adminTable.driver",
                  };
                  const roleLabel = t(roleKeyMap[admin.role]);
                  // Drivers are managed from the mobile app: dashboard admins
                  // may view/block/delete them but never edit their profile.
                  const isDriver = admin.role === "driver";
                  return (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <Avatar key={admin.profileImage ?? admin.id} className="size-9">
                          {admin.profileImage && (
                            <AvatarImage
                              src={admin.profileImage}
                              alt={admin.email}
                            />
                          )}
                          <AvatarFallback className="text-sm font-medium">
                            {admin.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {admin.email}
                      </TableCell>
                      <TableCell>{roleLabel}</TableCell>
                      <TableCell>{bakery?.name || "—"}</TableCell>
                      <TableCell>
                        {admin.isBlocked
                          ? t("adminTable.blocked")
                          : t("adminTable.active")}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          {!isDriver && (
                            <button
                              onClick={() => handleEditAdmin(admin)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleBlockAdmin(admin)}
                            className={`p-2 rounded-lg transition-colors ${
                              admin.isBlocked
                                ? "hover:bg-orange-100"
                                : "hover:bg-green-100"
                            }`}
                            title={admin.isBlocked ? "Unblock" : "Block"}
                          >
                            {admin.isBlocked ? (
                              <Lock className="w-4 h-4 text-orange-600" />
                            ) : (
                              <LockOpen className="w-4 h-4 text-green-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("admins.pageOf", {
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                  defaultValue: `Page ${pagination.page} of ${pagination.totalPages}`,
                })}{" "}
                · {pagination.total} {t("admins.totalShown")}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || isLoading}
                  aria-label={t("admins.previousPage")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={isLoading || page >= pagination.totalPages}
                  aria-label={t("admins.nextPage")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        {editingAdmin && (
          <EditAdmin admin={editingAdmin} onSubmit={handleUpdateAdmin} />
        )}
      </Sheet>
    </div>
  );
}
