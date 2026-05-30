import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Offer, CreateOfferPayload } from "@/lib/services/offer.service";

const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    percentage: z.coerce
      .number({ message: "Percentage must be a number" })
      .min(0, { message: "Must be 0 or greater" })
      .max(100, { message: "Must be 100 or less" }),
    startDate: z.string().optional(),
    expiryDate: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.expiryDate) {
        return new Date(data.startDate) <= new Date(data.expiryDate);
      }
      return true;
    },
    { message: "Expiry date must be after start date", path: ["expiryDate"] },
  );

type OfferFormValues = z.infer<typeof formSchema>;

interface OfferFormProps {
  mode: "add" | "edit";
  initial?: Offer;
  isSaving?: boolean;
  onSubmit: (payload: CreateOfferPayload) => Promise<void> | void;
}

function toIsoDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function OfferForm({ mode, initial, isSaving, onSubmit }: OfferFormProps) {
  const { t } = useTranslation();

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(formSchema) as Resolver<OfferFormValues, unknown>,
    defaultValues: initial
      ? {
          name: initial.name,
          percentage: initial.percentage,
          startDate: toIsoDateInput(initial.startDate),
          expiryDate: toIsoDateInput(initial.expiryDate),
          isActive: initial.isActive,
        }
      : {
          name: "",
          percentage: 0,
          startDate: "",
          expiryDate: "",
          isActive: true,
        },
  });

  const handleSubmit = async (values: OfferFormValues) => {
    const payload: CreateOfferPayload = {
      name: values.name.trim(),
      percentage: values.percentage,
      startDate: values.startDate || undefined,
      expiryDate: values.expiryDate || undefined,
      isActive: values.isActive,
    };
    await onSubmit(payload);
  };

  return (
    <SheetContent className="overflow-y-auto py-6">
      <SheetHeader>
        <SheetTitle>
          {mode === "add" ? t("offers.addOffer") : t("offers.editOffer")}
        </SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4 px-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("offers.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("offers.namePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("offers.percentage")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="10"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offers.startDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("offers.expiryDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      {t("offers.isActive")}
                    </FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving
                    ? t("common.loading")
                    : mode === "add"
                      ? t("offers.createOffer")
                      : t("offers.updateOffer")}
                </Button>
              </div>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
}
