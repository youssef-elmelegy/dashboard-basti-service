import { useEffect, useState } from "react";
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
import { SingleImageUploader } from "@/components/SingleImageUploader";
import { uploadImage } from "@/lib/api/chef.api";
import { UPLOAD_FOLDERS } from "@/lib/upload-folders";
import { convertToWebP } from "@/lib/image-utils";
import { useRegionStore } from "@/stores/regionStore";
import type { Driver, UpdateDriverPayload } from "@/lib/services/driver.service";

interface EditDriverProps {
  driver: Driver;
  onSubmit: (data: UpdateDriverPayload) => Promise<void>;
}

export default function EditDriver({ driver, onSubmit }: EditDriverProps) {
  const { t } = useTranslation();
  const regions = useRegionStore((state) => state.regions);
  const fetchRegions = useRegionStore((state) => state.fetchRegions);

  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    driver.profileImage ?? undefined,
  );
  const [formData, setFormData] = useState({
    name: driver.name ?? "",
    phoneNumber: driver.phoneNumber ?? "",
    regionId: driver.regionId ?? "",
  });

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    setFormData({
      name: driver.name ?? "",
      phoneNumber: driver.phoneNumber ?? "",
      regionId: driver.regionId ?? "",
    });
    setProfileImageUrl(driver.profileImage ?? undefined);
  }, [driver]);

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
      } finally {
        setUploadingImage(false);
      }
    } else {
      setProfileImageUrl(imageUrl);
    }
  };

  const isNameValid = formData.name.trim().length >= 2;
  const canSubmit = isNameValid && !isLoading && !uploadingImage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        regionId: formData.regionId || undefined,
        profileImage: profileImageUrl ?? null,
      });
    } catch (error) {
      console.error("Failed to update driver:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SheetContent className="overflow-y-auto py-6">
      <SheetHeader>
        <SheetTitle>{t("drivers.editDriver")}</SheetTitle>
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
          <Input value={driver.email} disabled readOnly />
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

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("drivers.region")}</label>
          <Select
            value={formData.regionId || ""}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, regionId: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("drivers.selectRegion")} />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SingleImageUploader
          label={`${t("drivers.profileImage")} (${t("drivers.optional")})`}
          imageUrl={profileImageUrl}
          onImageChange={handleProfileImageChange}
          isLoading={uploadingImage}
        />

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={!canSubmit} className="flex-1">
            {isLoading ? t("drivers.saving") : t("drivers.update")}
          </Button>
        </div>
      </form>
    </SheetContent>
  );
}
