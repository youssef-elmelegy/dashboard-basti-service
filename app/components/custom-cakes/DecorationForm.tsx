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
import { useState, useEffect } from "react";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useCakeStore } from "@/stores/imageStore";
import { useTagsStore } from "@/stores/tagsStore";
import type {
  CreateDecorationFormValues,
  UpdateDecorationFormValues,
  CreateDecorationWithVariantImagesFormValues,
} from "@/schemas/custom-cakes.schema";
import {
  createDecorationSchema,
  updateDecorationSchema,
  createDecorationWithVariantImagesSchema,
} from "@/schemas/custom-cakes.schema";
import type { Decoration } from "@/lib/services/decoration.service";
import { DecorationVariantImagesInput } from "./DecorationVariantImagesInput";

interface DecorationVariantImageData {
  shapeId: string;
  sideViewUrl: string;
  frontViewUrl: string;
  topViewUrl: string;
}

interface DecorationFormProps {
  decoration?: Decoration;
  isLoading?: boolean;
  onSubmit: (
    data:
      | CreateDecorationFormValues
      | UpdateDecorationFormValues
      | CreateDecorationWithVariantImagesFormValues,
  ) => Promise<void> | void;
  withVariantImages?: boolean;
}

export function DecorationForm({
  decoration,
  isLoading = false,
  onSubmit,
  withVariantImages = false,
}: DecorationFormProps) {
  const { t } = useTranslation();
  const isEditMode = !!decoration;
  const uploadCakeImage = useCakeStore((state) => state.uploadCakeImage);
  const tags = useTagsStore((state) => state.tags);
  const fetchTags = useTagsStore((state) => state.fetchTags);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    decoration?.decorationUrl || "",
  );
  const [variantImages, setVariantImages] = useState<
    DecorationVariantImageData[]
  >([]);

  useEffect(() => {
    if (!tags || tags.length === 0) {
      fetchTags();
    }
  }, [tags, fetchTags]);

  const schema = withVariantImages
    ? createDecorationWithVariantImagesSchema
    : isEditMode
      ? updateDecorationSchema
      : createDecorationSchema;

  const form = useForm<
    | CreateDecorationFormValues
    | UpdateDecorationFormValues
    | CreateDecorationWithVariantImagesFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: withVariantImages
      ? {
          title: decoration?.title || "",
          description: decoration?.description || "",
          decorationUrl: decoration?.decorationUrl || "",
          tagId: undefined,
          variantImages: [],
        }
      : decoration || {
          title: "",
          description: "",
          decorationUrl: "",
          tagId: undefined,
        },
  });

  const handleVariantImagesChange = (images: DecorationVariantImageData[]) => {
    setVariantImages(images);
    if (withVariantImages) {
      form.setValue("variantImages", images, { shouldValidate: true });
    }
  };

  const handleImagesChange = async (images: string[]) => {
    if (images.length === 0) {
      setUploadedImageUrl("");
      form.setValue("decorationUrl", "", { shouldValidate: true });
      return;
    }

    const imageToUpload = images[0];

    // Check if it's already a URL (not a data URL)
    if (
      !imageToUpload.startsWith("data:") &&
      !imageToUpload.startsWith("blob:")
    ) {
      setUploadedImageUrl(imageToUpload);
      form.setValue("decorationUrl", imageToUpload, { shouldValidate: true });
      return;
    }

    try {
      setUploadingImage(true);
      const response = await fetch(imageToUpload);
      const blob = await response.blob();
      const file = new File([blob], "decoration-image.jpg", {
        type: "image/jpeg",
      });

      const result = await uploadCakeImage(file);
      setUploadedImageUrl(result.secure_url);
      form.setValue("decorationUrl", result.secure_url, {
        shouldValidate: true,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (
    data:
      | CreateDecorationFormValues
      | UpdateDecorationFormValues
      | CreateDecorationWithVariantImagesFormValues,
  ) => {
    if (withVariantImages) {
      const variantData = data as CreateDecorationWithVariantImagesFormValues;
      const filteredVariants = variantImages.filter(
        (v) => v.sideViewUrl && v.frontViewUrl && v.topViewUrl,
      );

      const finalData: CreateDecorationWithVariantImagesFormValues = {
        title: variantData.title,
        description: variantData.description,
        decorationUrl: uploadedImageUrl || variantData.decorationUrl,
        tagId: variantData.tagId,
        variantImages: filteredVariants,
      };

      await onSubmit(finalData);
    } else {
      const finalData = {
        ...data,
        decorationUrl: uploadedImageUrl || data.decorationUrl,
      };
      await onSubmit(finalData);
    }
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
              <FormLabel>{t("customCakes.decorationTitle")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("customCakes.enterDecorationTitle")}
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
              <FormLabel>{t("customCakes.decorationDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("customCakes.enterDecorationDescription")}
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
          name="decorationUrl"
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
          name="tagId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.tag")}</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("customCakes.selectTag")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {withVariantImages && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">
              {t("customCakes.shapeVariants")}
            </h3>
            <DecorationVariantImagesInput
              variantImages={variantImages}
              onVariantImagesChange={handleVariantImagesChange}
            />
          </div>
        )}

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
