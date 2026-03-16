import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useRegionStore } from "@/stores/regionStore";
import { convertToWebP } from "@/lib/image-utils";
import type { CreateFlavorWithVariantImagesFormValues } from "@/schemas/custom-cakes.schema";
import { createFlavorWithVariantImagesSchema } from "@/schemas/custom-cakes.schema";
import type { Flavor } from "@/lib/services/flavor.service";
import { flavorApi } from "@/lib/services/flavor.service";
import { VariantImagesInput } from "./VariantImagesInput";

interface VariantImageData {
  shapeId: string;
  slicedViewUrl: string;
  frontViewUrl: string;
  topViewUrl: string;
}

interface FlavorFormProps {
  flavor?: Flavor;
  isLoading?: boolean;
  onSubmit: (
    data: CreateFlavorWithVariantImagesFormValues,
  ) => Promise<void> | void;
}

export function FlavorForm({
  flavor,
  isLoading = false,
  onSubmit,
}: FlavorFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!flavor;
  const uploadRegionImage = useRegionStore((state) => state.uploadRegionImage);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    flavor?.flavorUrl || "",
  );
  const [variantImages, setVariantImages] = useState<VariantImageData[]>([]);

  // Fetch existing variant images when editing
  useEffect(() => {
    if (flavor?.id) {
      flavorApi.getVariantImages(flavor.id).then((res) => {
        if (res.success && res.data) {
          const loaded: VariantImageData[] = res.data.map((v) => ({
            shapeId: v.shapeId,
            slicedViewUrl: v.slicedViewUrl,
            frontViewUrl: v.frontViewUrl,
            topViewUrl: v.topViewUrl,
          }));
          setVariantImages(loaded);
          form.setValue("variantImages", loaded, { shouldValidate: false });
        }
      }).catch(() => {
        // silently ignore — form is still usable without pre-loaded images
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flavor?.id]);

  const schema = createFlavorWithVariantImagesSchema;

  const form = useForm<CreateFlavorWithVariantImagesFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: flavor?.title || "",
      description: flavor?.description || "",
      flavorUrl: flavor?.flavorUrl || "",
      variantImages: [],
    },
  });

  const handleImagesChange = async (images: string[]) => {
    if (images.length === 0) {
      setUploadedImageUrl("");
      form.setValue("flavorUrl", "", { shouldValidate: true });
      return;
    }

    const imageToUpload = images[0];

    if (
      imageToUpload.startsWith("http://") ||
      imageToUpload.startsWith("https://")
    ) {
      setUploadedImageUrl(imageToUpload);
      form.setValue("flavorUrl", imageToUpload, { shouldValidate: true });
      return;
    }

    try {
      setUploadingImage(true);
      const webpBlob = await convertToWebP(imageToUpload);
      const file = new File([webpBlob], "flavor-image.webp", {
        type: "image/webp",
      });

      const result = await uploadRegionImage(file);
      setUploadedImageUrl(result.secure_url);
      form.setValue("flavorUrl", result.secure_url, { shouldValidate: true });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVariantImagesChange = (images: VariantImageData[]) => {
    setVariantImages(images);
    // Update the form field with the new variant images
    form.setValue("variantImages", images, { shouldValidate: true });
  };

  const handleSubmit = async (
    data: CreateFlavorWithVariantImagesFormValues,
  ) => {
    const filteredVariants = variantImages.filter(
      (v) => v.slicedViewUrl && v.frontViewUrl && v.topViewUrl,
    );

    const finalData: CreateFlavorWithVariantImagesFormValues = {
      title: data.title,
      description: data.description,
      flavorUrl: uploadedImageUrl || data.flavorUrl,
      variantImages: filteredVariants,
    };

    await onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 mt-6 px-6"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.flavorTitle")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("customCakes.enterFlavorTitle")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.flavorDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("customCakes.enterFlavorDescription")}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="flavorUrl"
          render={() => (
            <MultiImageUploader
              images={uploadedImageUrl ? [uploadedImageUrl] : []}
              onImagesChange={handleImagesChange}
              label={t("common.image")}
              maxImages={1}
            />
          )}
        />

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">
            {t("customCakes.shapeVariants")}
          </h3>
          <VariantImagesInput
            variantImages={variantImages}
            onVariantImagesChange={handleVariantImagesChange}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="w-full"
        >
          {uploadingImage || isLoading
            ? "..."
            : isEditMode
              ? t("common.update")
              : t("common.add")}
        </Button>
      </form>
    </Form>
  );
}
