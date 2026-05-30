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
import { SingleImageUploader } from "@/components/SingleImageUploader";
import { uploadImage } from "@/lib/api/chef.api";
import { UPLOAD_FOLDERS } from "@/lib/upload-folders";
import { convertToWebP } from "@/lib/image-utils";

interface EditAdminProps {
  admin: Admin;
  onSubmit: (data: UpdateAdminPayload) => Promise<void>;
}

export default function EditAdmin({ admin, onSubmit }: EditAdminProps) {
  const { t } = useTranslation();
  const bakeries = useBakeryStore((state) => state.bakeries);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    admin.profileImage || undefined,
  );
  const [formData, setFormData] = useState<UpdateAdminPayload>({
    role: admin.role,
    bakeryId: admin.bakeryId,
  });

  useEffect(() => {
    setFormData({
      role: admin.role,
      bakeryId: admin.bakeryId,
    });
    setProfileImageUrl(admin.profileImage || undefined);
  }, [admin]);

  const handleProfileImageChange = async (imageUrl: string | undefined) => {
    if (!imageUrl) {
      setProfileImageUrl(undefined);
      return;
    }

    if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
      try {
        setUploadingImage(true);
        const webpBlob = await convertToWebP(imageUrl);
        const file = new File([webpBlob], "admin-profile.webp", {
          type: "image/webp",
        });
        const response = await uploadImage(file, UPLOAD_FOLDERS.admins);
        setProfileImageUrl(response.data?.secure_url);
      } catch (error) {
        console.error("Error uploading admin profile image:", error);
        setProfileImageUrl(undefined);
      } finally {
        setUploadingImage(false);
      }
    } else {
      setProfileImageUrl(imageUrl);
    }
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
      await onSubmit({
        ...formData,
        profileImage: profileImageUrl ?? null,
      });
    } catch (error) {
      console.error("Failed to update admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SheetContent className="overflow-y-auto py-6">
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
          {formData.bakeryId && (
            <button
              type="button"
              onClick={() => handleBakeryChange("")}
              className="text-xs text-blue-600 hover:text-blue-800 mb-2"
            >
              {t("adminTable.clearSelection")}
            </button>
          )}
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

        <SingleImageUploader
          label={`${t("admins.profileImage")} (${t("adminTable.optional")})`}
          imageUrl={profileImageUrl}
          onImageChange={handleProfileImageChange}
          isLoading={uploadingImage}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admins.status")}</label>
          <div className="px-3 py-2 border">
            <p className="text-sm">
              {admin.isBlocked
                ? t("adminTable.blocked")
                : t("adminTable.active")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading || uploadingImage}
            className="flex-1"
          >
            {isLoading
              ? t("adminTable.updating")
              : uploadingImage
                ? t("common.loading")
                : t("admins.update")}
          </Button>
        </div>
      </form>
    </SheetContent>
  );
}
