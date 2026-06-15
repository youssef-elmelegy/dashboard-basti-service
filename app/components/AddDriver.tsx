import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { SingleImageUploader } from "@/components/SingleImageUploader";
import { uploadImage } from "@/lib/api/chef.api";
import { UPLOAD_FOLDERS } from "@/lib/upload-folders";
import { convertToWebP } from "@/lib/image-utils";
import type { CreateDriverPayload } from "@/lib/services/driver.service";

interface AddDriverProps {
  regionId: string;
  onSubmit: (data: CreateDriverPayload) => Promise<void>;
}

const PASSWORD_RULES = [
  { key: "minLength", test: (p: string) => p.length >= 8 },
  { key: "lowercase", test: (p: string) => /[a-z]/.test(p) },
  { key: "uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { key: "digit", test: (p: string) => /\d/.test(p) },
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddDriver({ regionId, onSubmit }: AddDriverProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        const file = new File([webpBlob], "driver-profile.webp", {
          type: "image/webp",
        });
        const response = await uploadImage(file, UPLOAD_FOLDERS.drivers);
        setProfileImageUrl(response.data?.secure_url);
      } catch (error) {
        console.error("Error uploading driver profile image:", error);
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
  const isNameValid = formData.name.trim().length >= 2;
  const canSubmit =
    isNameValid && isEmailValid && isPasswordValid && !isLoading && !uploadingImage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        regionId,
        profileImage: profileImageUrl,
      });
      setFormData({ name: "", email: "", password: "", phoneNumber: "" });
      setProfileImageUrl(undefined);
    } catch (error) {
      console.error("Failed to add driver:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SheetContent className="overflow-y-auto py-6">
      <SheetHeader>
        <SheetTitle>{t("drivers.addDriver")}</SheetTitle>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6 px-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("drivers.name")}</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("drivers.namePlaceholder")}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("drivers.email")}</label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="driver@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("drivers.password")}</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t("drivers.passwordPlaceholder")}
              required
              aria-invalid={formData.password.length > 0 && !isPasswordValid}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                <span>{t(`drivers.passwordRules.${check.key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("drivers.phone")} ({t("drivers.optional")})
          </label>
          <Input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="+201234567890"
          />
        </div>

        <SingleImageUploader
          label={`${t("drivers.profileImage")} (${t("drivers.optional")})`}
          imageUrl={profileImageUrl}
          onImageChange={handleProfileImageChange}
          isLoading={uploadingImage}
        />

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={!canSubmit} className="flex-1">
            {isLoading
              ? t("drivers.creating")
              : uploadingImage
                ? t("common.loading")
                : t("drivers.create")}
          </Button>
        </div>
      </form>
    </SheetContent>
  );
}
