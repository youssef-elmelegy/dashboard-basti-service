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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useShapeStore } from "@/stores/shapeStore";
import { convertToWebP } from "@/lib/image-utils";
import type {
  CreateShapeFormValues,
  UpdateShapeFormValues,
} from "@/schemas/custom-cakes.schema";
import {
  createShapeSchema,
  updateShapeSchema,
} from "@/schemas/custom-cakes.schema";
import type { Shape } from "@/lib/services/shape.service";

interface ShapeFormProps {
  shape?: Shape;
  isLoading?: boolean;
  onSubmit: (
    data: CreateShapeFormValues | UpdateShapeFormValues,
  ) => Promise<void>;
}

export function ShapeForm({
  shape,
  isLoading = false,
  onSubmit,
}: ShapeFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!shape;
  const uploadShapeImage = useShapeStore((state) => state.uploadShapeImage);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    shape?.shapeUrl || "",
  );

  const form = useForm<CreateShapeFormValues | UpdateShapeFormValues>({
    resolver: zodResolver(isEditMode ? updateShapeSchema : createShapeSchema),
    defaultValues: shape || {
      title: "",
      description: "",
      shapeUrl: "",
      size: "medium",
      capacity: 0,
      minPrepHours: undefined,
    },
  });

  const handleImagesChange = async (images: string[]) => {
    if (images.length === 0) {
      setUploadedImageUrl("");
      form.setValue("shapeUrl", "", { shouldValidate: true });
      return;
    }

    const imageToUpload = images[0];

    // Check if it's already a URL (not a data URL)
    if (
      !imageToUpload.startsWith("data:") &&
      !imageToUpload.startsWith("blob:")
    ) {
      setUploadedImageUrl(imageToUpload);
      form.setValue("shapeUrl", imageToUpload, { shouldValidate: true });
      return;
    }

    try {
      setUploadingImage(true);
      const webpBlob = await convertToWebP(imageToUpload);
      const file = new File([webpBlob], "shape-image.webp", {
        type: "image/webp",
      });

      const uploadResult = await uploadShapeImage(file);
      if (uploadResult.url) {
        setUploadedImageUrl(uploadResult.url);
        form.setValue("shapeUrl", uploadResult.url, { shouldValidate: true });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (
    data: CreateShapeFormValues | UpdateShapeFormValues,
  ) => {
    const finalData = {
      ...data,
      shapeUrl: uploadedImageUrl || data.shapeUrl,
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
              <FormLabel>{t("customCakes.shapeTitle")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("customCakes.enterShapeTitle")}
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
              <FormLabel>{t("customCakes.shapeDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("customCakes.enterShapeDescription")}
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
          name="shapeUrl"
          render={() => (
            <MultiImageUploader
              images={uploadedImageUrl ? [uploadedImageUrl] : []}
              onImagesChange={handleImagesChange}
              label={t("common.image")}
              maxImages={1}
            />
          )}
        />

        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.size")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("customCakes.selectSize")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="small">
                    {t("customCakes.small")}
                  </SelectItem>
                  <SelectItem value="medium">
                    {t("customCakes.medium")}
                  </SelectItem>
                  <SelectItem value="large">
                    {t("customCakes.large")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.capacity")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={t("customCakes.enterCapacity")}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minPrepHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.minPrepHours")}</FormLabel>
              <Select
                value={field.value ? field.value.toString() : ""}
                onValueChange={(value) =>
                  field.onChange(value ? parseFloat(value) : undefined)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("customCakes.enterMinPrepHours")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
