import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TagSelector } from "@/components/TagSelector";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { FlavorsSection } from "@/components/FlavorsSection";
import { SizesSection } from "@/components/SizesSection";
import {
  addSmallCakeSchema,
  type AddSmallCakeFormValues,
} from "@/schemas/small-cake.schema";

interface AddSmallCakeFormProps {
  onSubmit: (values: AddSmallCakeFormValues) => void;
  isLoading?: boolean;
}

export function AddSmallCakeForm({
  onSubmit,
  isLoading = false,
}: AddSmallCakeFormProps) {
  const { t } = useTranslation();

  const form = useForm<AddSmallCakeFormValues>({
    resolver: zodResolver(addSmallCakeSchema),
    defaultValues: {
      name: "",
      description: "",
      images: [],
      basePrice: 0,
      capacity: 0,
      tags: [],
      flavors: [""],
      sizes: [{ name: "", price: 0 }],
      isActive: true,
    },
  });

  const {
    fields: flavorFields,
    append: appendFlavor,
    remove: removeFlavor,
  } = useFieldArray({
    control: form.control,
    name: "flavors" as never,
  });

  const {
    fields: sizeFields,
    append: appendSize,
    remove: removeSize,
  } = useFieldArray({
    control: form.control,
    name: "sizes",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("products.name")}</FormLabel>
              <Input placeholder={t("smallCakes.namePlaceholder")} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("products.description")}</FormLabel>
              <Input
                placeholder={t("smallCakes.descriptionPlaceholder")}
                {...field}
              />
              <FormDescription>{t("products.descriptionHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("products.price")}</FormLabel>
                <Input
                  type="number"
                  placeholder="45"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("products.capacity")}</FormLabel>
                <Input
                  type="number"
                  placeholder="10"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
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
                label={t("products.tags")}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <FlavorsSection<AddReadyCakeFormValues>
          control={form.control}
          fields={flavorFields}
          fieldName="flavors"
          onAppend={() => appendFlavor("" as never)}
          onRemove={removeFlavor}
        />

        <Separator />

        <SizesSection<AddReadyCakeFormValues>
          control={form.control}
          fields={sizeFields}
          fieldName="sizes"
          onAppend={() => appendSize({ name: "", price: 0 })}
          onRemove={removeSize}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("common.loading") : t("smallCakes.createCake")}
        </Button>
      </form>
    </Form>
  );
}
