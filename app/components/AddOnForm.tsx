import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { SingleImageUploader } from "@/components/SingleImageUploader";
import { useAddOnStore } from "@/stores/addOnStore";
import { useTagsStore } from "@/stores/tagsStore";
import { convertToWebP } from "@/lib/image-utils";
import type { AddOn } from "@/data/products";
import type {
  CreateAddOnRequest,
  UpdateAddOnRequest,
} from "@/lib/services/addOn.service";

const optionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["color", "number", "letter", "text"]),
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  imageUrl: z.string().optional(),
});

const addOnSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  category: z.enum(["balloons", "cards", "candles", "decorations", "other"]),
  tagId: z.string().optional(),
  isActive: z.boolean(),
  options: z.array(optionSchema).optional(),
});

type AddOnFormValues = z.infer<typeof addOnSchema>;
type OptionValues = z.infer<typeof optionSchema>;

interface AddOnFormProps {
  initialAddOn?: AddOn;
  onSubmit: (
    addOn: CreateAddOnRequest | UpdateAddOnRequest,
  ) => Promise<void> | void;
  isLoading?: boolean;
}

const categoryLabels: Record<string, string> = {
  balloons: "Balloons",
  cards: "Cards",
  candles: "Candles",
  decorations: "Decorations",
  other: "Other",
};

const optionTypes = ["color", "number", "letter", "text"] as const;

export function AddOnForm({
  initialAddOn,
  onSubmit,
  isLoading = false,
}: AddOnFormProps) {
  const { t } = useTranslation();
  const uploadAddOnImage = useAddOnStore((state) => state.uploadAddOnImage);
  const tags = useTagsStore((s) => s.tags);
  const fetchTags = useTagsStore((s) => s.fetchTags);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(
    initialAddOn?.images || [],
  );
  const [newOption, setNewOption] = useState<OptionValues>({
    type: "text",
    label: "",
    value: "",
  });
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
    null,
  );

  const form = useForm<AddOnFormValues>({
    resolver: zodResolver(addOnSchema),
    defaultValues: {
      name: initialAddOn?.name || "",
      description: initialAddOn?.description || "",
      images: initialAddOn?.images || [],
      category: (initialAddOn?.category as any) || "decorations",
      tagId: initialAddOn?.tagId || undefined,
      isActive: initialAddOn?.isActive ?? true,
      options:
        initialAddOn?.options && Array.isArray(initialAddOn.options)
          ? (initialAddOn.options as OptionValues[])
          : [],
    },
  });

  const watchedOptions = form.watch("options") || [];

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleImagesChange = async (images: string[]) => {
    console.log("handleImagesChange called with images:", images);
    form.setValue("images", images, { shouldValidate: true });

    // If images were removed
    if (images.length === 0) {
      setUploadedImageUrls([]);
      return;
    }

    // Upload images that are base64 or data URLs
    const urlsToUpload: string[] = [];
    const alreadyUploadedUrls: string[] = [];

    for (const image of images) {
      if (image.startsWith("data:") || image.startsWith("blob:")) {
        urlsToUpload.push(image);
      } else {
        // Already a Cloudinary URL
        alreadyUploadedUrls.push(image);
      }
    }

    if (urlsToUpload.length > 0) {
      try {
        setUploadingImage(true);
        const uploadedUrls: string[] = [];

        for (const imageUrl of urlsToUpload) {
          const webpBlob = await convertToWebP(imageUrl);
          const file = new File([webpBlob], "addon-image.webp", {
            type: "image/webp",
          });
          const result = await uploadAddOnImage(file);
          uploadedUrls.push(result.secure_url);
        }

        // Combine uploaded URLs with already uploaded ones
        const allUrls = [...alreadyUploadedUrls, ...uploadedUrls];
        setUploadedImageUrls(allUrls);
        form.setValue("images", allUrls, { shouldValidate: true });
      } catch (error) {
        console.error("Error uploading images:", error);
        // Keep the uploaded URLs that succeeded
        setUploadedImageUrls(alreadyUploadedUrls);
        form.setValue("images", alreadyUploadedUrls, { shouldValidate: true });
      } finally {
        setUploadingImage(false);
      }
    } else {
      // All images are already uploaded
      setUploadedImageUrls(alreadyUploadedUrls);
    }
  };

  const handleAddOption = () => {
    if (!newOption.label || !newOption.value) {
      return;
    }

    if (editingOptionIndex !== null) {
      // Update existing option
      const updatedOptions = [...watchedOptions];
      updatedOptions[editingOptionIndex] = newOption;
      form.setValue("options", updatedOptions, { shouldValidate: true });
      setEditingOptionIndex(null);
    } else {
      // Add new option
      const updatedOptions = [...watchedOptions, newOption];
      form.setValue("options", updatedOptions, { shouldValidate: true });
    }

    setNewOption({ type: "text", label: "", value: "" });
  };

  const handleEditOption = (index: number) => {
    setNewOption(watchedOptions[index]);
    setEditingOptionIndex(index);
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = watchedOptions.filter((_, i) => i !== index);
    form.setValue("options", updatedOptions, { shouldValidate: true });
  };

  const handleOptionImageChange = async (imageUrl: string | undefined) => {
    console.log("handleOptionImageChange called with imageUrl:", imageUrl);

    // Update the new option with the image URL
    if (!imageUrl) {
      setNewOption({ ...newOption, imageUrl: undefined });
      return;
    }

    // If it's already uploaded (Cloudinary URL), just update
    if (!imageUrl.startsWith("data:") && !imageUrl.startsWith("blob:")) {
      setNewOption({ ...newOption, imageUrl });
      return;
    }

    // Upload data URL
    try {
      setUploadingImage(true);
      const webpBlob = await convertToWebP(imageUrl);
      const file = new File([webpBlob], "option-image.webp", {
        type: "image/webp",
      });
      const result = await uploadAddOnImage(file);
      console.log("Option image uploaded successfully:", result.secure_url);
      setNewOption({ ...newOption, imageUrl: result.secure_url });
    } catch (error) {
      console.error("Error uploading option image:", error);
      // Keep the data URL so user can try again
      setNewOption({ ...newOption, imageUrl });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (values: AddOnFormValues) => {
    console.log("AddOnForm.handleSubmit called with values:", values);
    console.log("uploadedImageUrls:", uploadedImageUrls);

    // Use uploaded URLs instead of data URLs
    const finalValues: CreateAddOnRequest | UpdateAddOnRequest = {
      name: values.name,
      description: values.description,
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : values.images,
      category: values.category,
      isActive: values.isActive,
      ...(values.tagId && { tagId: values.tagId }),
    };
    console.log("finalValues to submit:", finalValues);

    const result = onSubmit(finalValues);

    // Handle async submission
    if (result instanceof Promise) {
      result.then(() => {
        form.reset();
        setUploadedImageUrls([]);
        setNewOption({ type: "text", label: "", value: "" });
        setEditingOptionIndex(null);
      });
    } else {
      form.reset();
      setUploadedImageUrls([]);
      setNewOption({ type: "text", label: "", value: "" });
      setEditingOptionIndex(null);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 mt-6 px-6"
      >
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("products.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("addOns.namePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("products.description")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("addOns.descriptionPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("products.descriptionHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Images */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <MultiImageUploader
              images={field.value}
              onImagesChange={handleImagesChange}
              label={t("products.images")}
              maxImages={5}
            />
          )}
        />

        {/* Category and Price */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("addOns.category")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          t("addOns.selectCategory") || "Select category"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="balloons">
                      {categoryLabels["balloons"]}
                    </SelectItem>
                    <SelectItem value="cards">
                      {categoryLabels["cards"]}
                    </SelectItem>
                    <SelectItem value="candles">
                      {categoryLabels["candles"]}
                    </SelectItem>
                    <SelectItem value="decorations">
                      {categoryLabels["decorations"]}
                    </SelectItem>
                    <SelectItem value="other">
                      {categoryLabels["other"]}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tag */}
        <FormField
          control={form.control}
          name="tagId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.selectTag")}</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("common.selectTag") || "Select tag"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tags
                      .filter(
                        (tag) =>
                          Array.isArray(tag.types) &&
                          tag.types.includes("addons"),
                      )
                      .map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Add-on Options</h3>
          <FormDescription>
            Add customization options for this add-on (colors, sizes, etc.)
          </FormDescription>

          {/* Existing Options */}
          {watchedOptions && watchedOptions.length > 0 && (
            <div className="space-y-2">
              {watchedOptions.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 gap-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt={option.label}
                        className="w-12 h-12 object-cover rounded border border-border"
                      />
                    )}
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.type} • {option.value}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOption(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Option Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-secondary/20">
            <h4 className="font-medium">
              {editingOptionIndex !== null ? "Edit Option" : "New Option"}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Select
                value={newOption.type}
                onValueChange={(value) =>
                  setNewOption({
                    ...newOption,
                    type: value as OptionValues["type"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {optionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Label (e.g., 'Red', 'Small')"
              value={newOption.label}
              onChange={(e) =>
                setNewOption({ ...newOption, label: e.target.value })
              }
            />

            <Input
              placeholder="Value (e.g., '#FF0000', 'S')"
              value={newOption.value}
              onChange={(e) =>
                setNewOption({ ...newOption, value: e.target.value })
              }
            />

            <SingleImageUploader
              imageUrl={newOption.imageUrl}
              onImageChange={handleOptionImageChange}
              isLoading={uploadingImage}
              label="Option Image (optional)"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddOption}
                disabled={
                  !newOption.label || !newOption.value || uploadingImage
                }
              >
                {editingOptionIndex !== null ? "Update Option" : "Add Option"}
              </Button>
              {editingOptionIndex !== null && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingOptionIndex(null);
                    setNewOption({ type: "text", label: "", value: "" });
                  }}
                  disabled={uploadingImage}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base cursor-pointer">
                  {t("addOns.active")}
                </FormLabel>
                <FormDescription>
                  {t("addOns.activeDescription")}
                </FormDescription>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || uploadingImage}
        >
          {uploadingImage
            ? t("common.loading")
            : isLoading
              ? t("common.loading")
              : initialAddOn
                ? t("addOns.updateAddOn")
                : t("addOns.createAddOn")}
        </Button>
      </form>
    </Form>
  );
}
