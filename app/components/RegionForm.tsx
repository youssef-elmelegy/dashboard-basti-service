import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useRegionStore } from "@/stores/regionStore";
import { useState } from "react";
import type { Region } from "@/data/regions";

const regionFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be at most 255 characters"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isAvailable: z.boolean(),
});

export type RegionFormValues = z.infer<typeof regionFormSchema>;

interface RegionFormProps {
  region?: Region;
  onSubmit: (values: RegionFormValues) => Promise<void>;
  isLoading?: boolean;
  mode?: "add" | "edit";
}

export function RegionForm({
  region,
  onSubmit,
  isLoading = false,
  mode = "add",
}: RegionFormProps) {
  const { t } = useTranslation();
  const uploadRegionImage = useRegionStore((state) => state.uploadRegionImage);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    region?.image || "",
  );

  const form = useForm<RegionFormValues>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: {
      name: region?.name || "",
      image: region?.image || "",
      isAvailable: region?.isAvailable ?? true,
    },
  });

  const handleImageChange = async (images: string[]) => {
    console.log("handleImageChange called with images:", images);

    // If image was removed
    if (images.length === 0) {
      setUploadedImageUrl("");
      form.setValue("image", "", { shouldValidate: true });
      return;
    }

    const image = images[0]; // Only handle single image for regions

    // Check if it's already a URL or if it needs to be uploaded
    if (image.startsWith("http://") || image.startsWith("https://")) {
      // Already a URL
      setUploadedImageUrl(image);
      form.setValue("image", image, { shouldValidate: true });
    } else if (image.startsWith("data:") || image.startsWith("blob:")) {
      // Need to upload
      try {
        setUploadingImage(true);
        console.log("Uploading image to Cloudinary...");

        // Convert data URL to File
        const response = await fetch(image);
        const blob = await response.blob();
        console.log("Blob created - size:", blob.size, "type:", blob.type);

        const file = new File([blob], "region-image.jpg", {
          type: "image/jpeg",
        });
        console.log(
          "File object created - size:",
          file.size,
          "type:",
          file.type,
          "name:",
          file.name,
        );

        // Upload to Cloudinary using store
        console.log("Calling uploadRegionImage with file:", file);
        const result = await uploadRegionImage(file);
        console.log("Upload result:", result);

        const uploadedUrl = result.secure_url;
        setUploadedImageUrl(uploadedUrl);
        form.setValue("image", uploadedUrl, { shouldValidate: true });
        console.log("Image uploaded successfully:", uploadedUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        // Keep the old image on error
        if (region?.image) {
          setUploadedImageUrl(region.image);
          form.setValue("image", region.image, { shouldValidate: true });
        }
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (values: RegionFormValues) => {
    const finalValues = {
      ...values,
      image: uploadedImageUrl || values.image,
    };
    await onSubmit(finalValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 px-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("regions.regionName")}</FormLabel>
              <Input placeholder="e.g., Cairo, Alexandria" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={() => (
            <MultiImageUploader
              images={uploadedImageUrl ? [uploadedImageUrl] : []}
              onImagesChange={handleImageChange}
              label={t("regions.regionImage")}
              maxImages={1}
              error={form.formState.errors.image?.message}
            />
          )}
        />

        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id="isAvailable"
              />
              <FormLabel htmlFor="isAvailable" className="cursor-pointer mb-0">
                {t("regions.availableForOrders")}
              </FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || uploadingImage}
        >
          {uploadingImage || isLoading
            ? t("regions.loading")
            : mode === "edit"
              ? t("regions.updateButton")
              : t("regions.addButton")}
        </Button>
      </form>
    </Form>
  );
}
