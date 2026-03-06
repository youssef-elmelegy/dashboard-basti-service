import { useState } from "react";
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
import type { CreateAdminPayload } from "@/lib/services/admin.service";

interface AddAdminProps {
  onSubmit: (data: CreateAdminPayload) => Promise<void>;
}

export default function AddAdmin({ onSubmit }: AddAdminProps) {
  const { t } = useTranslation();
  const bakeries = useBakeryStore((state) => state.bakeries);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "admin" as "super_admin" | "admin" | "manager",
    bakeryId: "",
    profileImage: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      bakeryId: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        bakeryId: formData.bakeryId || undefined,
        profileImage: formData.profileImage || undefined,
      });

      setFormData({
        email: "",
        password: "",
        role: "admin",
        bakeryId: "",
        profileImage: "",
      });
    } catch (error) {
      console.error("Failed to add admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SheetContent className="overflow-y-auto py-6">
      <SheetHeader>
        <SheetTitle>{t("admins.addAdmin")}</SheetTitle>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6 px-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admins.email")}</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admins.password")}</label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 8 characters with uppercase, lowercase, and numbers"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admins.role")}</label>
          <Select value={formData.role} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">
                {t("adminTable.superAdmin")}
              </SelectItem>
              <SelectItem value="admin">{t("adminTable.admin")}</SelectItem>
              <SelectItem value="manager">{t("adminTable.manager")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("admins.bakery")} ({t("adminTable.optional")})
          </label>
          <Select
            value={formData.bakeryId || ""}
            onValueChange={handleBakeryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("adminTable.selectBakery")} />
            </SelectTrigger>
            <SelectContent>
              {bakeries.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">
                  {t("adminTable.noBakeries")}
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
            {t("admins.profileImage")} ({t("adminTable.optional")})
          </label>
          <Input
            type="url"
            name="profileImage"
            value={formData.profileImage}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? t("adminTable.creating") : t("admins.create")}
          </Button>
        </div>
      </form>
    </SheetContent>
  );
}
