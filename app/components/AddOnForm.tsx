import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
import { TagSelector } from "@/components/TagSelector";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import type { AddOn } from "@/data/products";

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
  category: z.enum([
    "card",
    "balloon",
    "candle",
    "decoration",
    "sweets",
    "other",
  ]),
  price: z
    .number()
    .min(0.01, "Price must be at least $0.01")
    .max(10000, "Price must be less than $10000"),
  tags: z.array(z.string()).min(0, "Tags are optional"),
  isActive: z.boolean(),
});

type AddOnFormValues = z.infer<typeof addOnSchema>;

interface AddOnFormProps {
  initialAddOn?: AddOn;
  onSubmit: (addOn: Omit<AddOn, "id">) => void;
  isLoading?: boolean;
}

const categoryLabels: Record<string, string> = {
  card: "Card",
  balloon: "Balloon",
  candle: "Candle",
  decoration: "Decoration",
  sweets: "Sweets",
  other: "Other",
};

const categoryLabelsAr: Record<string, string> = {
  card: "بطاقة",
  balloon: "بالون",
  candle: "شمعة",
  decoration: "زينة",
  sweets: "حلويات",
  other: "أخرى",
};

export function AddOnForm({
  initialAddOn,
  onSubmit,
  isLoading = false,
}: AddOnFormProps) {
  const { t, i18n } = useTranslation();

  const form = useForm<AddOnFormValues>({
    resolver: zodResolver(addOnSchema),
    defaultValues: {
      name: initialAddOn?.name || "",
      description: initialAddOn?.description || "",
      images: initialAddOn?.images || [],
      category: initialAddOn?.category || "card",
      price: initialAddOn?.price || 0,
      tags: initialAddOn?.tags || [],
      isActive: initialAddOn?.isActive ?? true,
    },
  });

  const handleSubmit = (values: AddOnFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description,
      images: values.images,
      category: values.category,
      price: values.price,
      tags: values.tags,
      isActive: values.isActive,
    });
  };

  const isArabic = i18n.language === "ar";
  const categoryLabels_ = isArabic ? categoryLabelsAr : categoryLabels;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 px-4"
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
              onImagesChange={field.onChange}
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
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="card">
                      {categoryLabels_["card"]}
                    </SelectItem>
                    <SelectItem value="balloon">
                      {categoryLabels_["balloon"]}
                    </SelectItem>
                    <SelectItem value="candle">
                      {categoryLabels_["candle"]}
                    </SelectItem>
                    <SelectItem value="decoration">
                      {categoryLabels_["decoration"]}
                    </SelectItem>
                    <SelectItem value="sweets">
                      {categoryLabels_["sweets"]}
                    </SelectItem>
                    <SelectItem value="other">
                      {categoryLabels_["other"]}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("products.price")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("products.tags")}</FormLabel>
              <FormControl>
                <TagSelector
                  selectedTags={field.value}
                  onTagToggle={(tag) => {
                    const current = field.value;
                    if (current.includes(tag)) {
                      field.onChange(current.filter((t) => t !== tag));
                    } else {
                      field.onChange([...current, tag]);
                    }
                  }}
                  label=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? t("common.loading")
            : initialAddOn
            ? t("addOns.updateAddOn")
            : t("addOns.createAddOn")}
        </Button>
      </form>
    </Form>
  );
}
