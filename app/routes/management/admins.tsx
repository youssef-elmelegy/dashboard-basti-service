import { Plus, AlertCircle, Loader2 } from "lucide-react";
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
import { Edit2, Lock, LockOpen } from "lucide-react";

export default function AdminsPage() {
  const { t } = useTranslation();
  const admins = useAdminStore((state) => state.admins);
  const isLoading = useAdminStore((state) => state.isLoading);
  const error = useAdminStore((state) => state.error);
  const fetchAdmins = useAdminStore((state) => state.fetchAdmins);
  const addAdmin = useAdminStore((state) => state.addAdmin);
  const updateAdmin = useAdminStore((state) => state.updateAdmin);
  const blockAdmin = useAdminStore((state) => state.blockAdmin);
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
        title: isBlocking ? "Block Admin?" : "Unblock Admin?",
        description: isBlocking
          ? `Are you sure you want to block ${admin.email}? This action cannot be undone.`
          : `Are you sure you want to unblock ${admin.email}? This action cannot be undone.`,
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
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Bakery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => {
                  const bakery = bakeries.find((b) => b.id === admin.bakeryId);
                  return (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.email}
                      </TableCell>
                      <TableCell>{admin.role}</TableCell>
                      <TableCell>{bakery?.name || "—"}</TableCell>
                      <TableCell>
                        {admin.isBlocked ? "Blocked" : "Active"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBlockAdmin(admin)}
                            className={`p-2 rounded-lg transition-colors ${
                              admin.isBlocked
                                ? "hover:bg-green-100"
                                : "hover:bg-orange-100"
                            }`}
                            title={admin.isBlocked ? "Unblock" : "Block"}
                          >
                            {admin.isBlocked ? (
                              <LockOpen className="w-4 h-4 text-green-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-orange-600" />
                            )}
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
        {editingAdmin && (
          <EditAdmin admin={editingAdmin} onSubmit={handleUpdateAdmin} />
        )}
      </Sheet>
    </div>
  );
}
