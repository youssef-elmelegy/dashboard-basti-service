import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBakeryStore } from "@/stores/bakeryStore";
import type { Admin, UpdateAdminPayload } from "@/lib/services/admin.service";

interface EditAdminProps {
  admin: Admin;
  onSubmit: (data: UpdateAdminPayload) => Promise<void>;
}

export default function EditAdmin({ admin, onSubmit }: EditAdminProps) {
  const { t } = useTranslation();
  const bakeries = useBakeryStore((state) => state.bakeries);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateAdminPayload>({
    role: admin.role,
    bakeryId: admin.bakeryId,
    profileImage: admin.profileImage || undefined,
  });

  useEffect(() => {
    setFormData({
      role: admin.role,
      bakeryId: admin.bakeryId,
      profileImage: admin.profileImage || undefined,
    });
  }, [admin]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as "super_admin" | "admin" | "manager",
    }));
  };

  const handleBakeryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      bakeryId: value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Failed to update admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SheetContent className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{t("admins.editAdmin")}</SheetTitle>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6 px-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admins.email")}</label>
          <Input
            type="email"
            value={admin.email}
            disabled
            className="bg-gray-100"
          />
          <p className="text-xs text-gray-500">
            {t("admins.emailCannotChange")}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admins.role")}</label>
          <Select value={formData.role} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("admins.bakery")} (Optional)
          </label>
          {formData.bakeryId && (
            <button
              type="button"
              onClick={() => handleBakeryChange("")}
              className="text-xs text-blue-600 hover:text-blue-800 mb-2"
            >
              Clear selection
            </button>
          )}
          <Select
            value={formData.bakeryId || ""}
            onValueChange={handleBakeryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a bakery (optional)" />
            </SelectTrigger>
            <SelectContent>
              {bakeries.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">
                  No bakeries available
                </div>
              ) : (
                bakeries.map((bakery) => (
                  <SelectItem key={bakery.id} value={bakery.id}>
                    {bakery.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("admins.profileImage")} (Optional)
          </label>
          <Input
            type="url"
            name="profileImage"
            value={formData.profileImage || ""}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admins.status")}</label>
          <div className="px-3 py-2 border">
            <p className="text-sm">{admin.isBlocked ? "Blocked" : "Active"}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Updating..." : t("admins.update")}
          </Button>
        </div>
      </form>
    </SheetContent>
  );
}
