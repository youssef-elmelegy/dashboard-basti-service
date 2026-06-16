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
import { Check, Eye, EyeOff, X } from "lucide-react";
import { SingleImageUploader } from "@/components/SingleImageUploader";
import { uploadImage } from "@/lib/api/chef.api";
import { UPLOAD_FOLDERS } from "@/lib/upload-folders";
import { convertToWebP } from "@/lib/image-utils";

interface AddAdminProps {
  onSubmit: (data: CreateAdminPayload) => Promise<void>;
}

const PASSWORD_RULES = [
  { key: "minLength", test: (p: string) => p.length >= 8 },
  { key: "lowercase", test: (p: string) => /[a-z]/.test(p) },
  { key: "uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { key: "digit", test: (p: string) => /\d/.test(p) },
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddAdmin({ onSubmit }: AddAdminProps) {
  const { t } = useTranslation();
  const bakeries = useBakeryStore((state) => state.bakeries);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    undefined,
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "admin" as "super_admin" | "admin" | "manager",
    bakeryId: "",
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

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    ok: rule.test(formData.password),
  }));
  const isPasswordValid = passwordChecks.every((c) => c.ok);
  const isEmailValid = EMAIL_REGEX.test(formData.email);
  const canSubmit =
    isEmailValid && isPasswordValid && !isLoading && !uploadingImage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);

    try {
      await onSubmit({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        bakeryId: formData.bakeryId || undefined,
        profileImage: profileImageUrl,
      });

      setFormData({
        email: "",
        password: "",
        role: "admin",
        bakeryId: "",
      });
      setProfileImageUrl(undefined);
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
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t("admins.passwordPlaceholder")}
              required
              aria-invalid={
                formData.password.length > 0 && !isPasswordValid
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <ul className="space-y-1 text-xs">
            {passwordChecks.map((check) => (
              <li
                key={check.key}
                className={`flex items-center gap-2 ${
                  check.ok ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {check.ok ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>{t(`admins.passwordRules.${check.key}`)}</span>
              </li>
            ))}
          </ul>
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

        <SingleImageUploader
          label={`${t("admins.profileImage")} (${t("adminTable.optional")})`}
          imageUrl={profileImageUrl}
          onImageChange={handleProfileImageChange}
          isLoading={uploadingImage}
        />

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="flex-1"
          >
            {isLoading
              ? t("adminTable.creating")
              : uploadingImage
                ? t("common.loading")
                : t("admins.create")}
          </Button>
        </div>
      </form>
    </SheetContent>
  );
}
