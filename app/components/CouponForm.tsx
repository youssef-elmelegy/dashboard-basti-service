import { useEffect } from "react";
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
import { Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegionStore } from "@/stores/regionStore";
import {
  DISCOUNT_TYPES,
  type Coupon,
  type DiscountType,
  type GenerateCouponPayload,
} from "@/lib/services/coupon.service";

const formSchema = z
  .object({
    code: z
      .string()
      .regex(/^[A-Z0-9]{6}$/, {
        message: "Code must be exactly 6 uppercase letters or digits",
      }),
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(150, { message: "Name must not exceed 150 characters" }),
    discountType: z.enum(["percentage", "fixed_amount", "free_shipping"]),
    discountValue: z.coerce
      .number({ message: "Discount value must be a number" })
      .min(0, { message: "Discount value must be 0 or greater" }),
    minOrderValue: z.coerce
      .number({ message: "Minimum order value must be a number" })
      .min(0)
      .optional(),
    startDate: z.string().optional(),
    expiryDate: z.string().optional(),
    usageLimitGlobal: z.coerce
      .number({ message: "Global usage limit must be a number" })
      .int()
      .min(0, { message: "Must be 0 or greater" }),
    usageLimitPerUser: z.coerce
      .number({ message: "Per-user usage limit must be a number" })
      .int()
      .min(0, { message: "Must be 0 or greater" }),
    isGlobal: z.boolean(),
    isActive: z.boolean(),
    regionId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.isGlobal && !data.regionId) return false;
      return true;
    },
    {
      message: "Region is required when coupon is not global",
      path: ["regionId"],
    },
  )
  .refine(
    (data) => {
      if (data.startDate && data.expiryDate) {
        return new Date(data.startDate) <= new Date(data.expiryDate);
      }
      return true;
    },
    {
      message: "Expiry date must be after start date",
      path: ["expiryDate"],
    },
  );

export type CouponFormValues = z.infer<typeof formSchema>;

interface CouponFormProps {
  mode: "add" | "edit";
  initial?: Coupon;
  isSaving?: boolean;
  onSubmit: (payload: GenerateCouponPayload) => Promise<void> | void;
}

function toIsoDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const CODE_ALPHABET = "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789";

function generateCouponCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export default function CouponForm({
  mode,
  initial,
  isSaving,
  onSubmit,
}: CouponFormProps) {
  const { t } = useTranslation();
  const regions = useRegionStore((state) => state.regions);
  const fetchRegions = useRegionStore((state) => state.fetchRegions);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(formSchema) as Resolver<CouponFormValues, unknown>,
    mode: "onChange",
    defaultValues: initial
      ? {
          code: initial.code,
          name: initial.name,
          discountType: initial.discountType,
          discountValue: Number(initial.discountValue),
          minOrderValue: initial.minOrderValue ?? undefined,
          startDate: toIsoDateInput(initial.startDate),
          expiryDate: toIsoDateInput(initial.expiryDate),
          usageLimitGlobal: initial.usageLimitGlobal,
          usageLimitPerUser: initial.usageLimitPerUser,
          isGlobal: initial.isGlobal,
          isActive: initial.isActive,
          regionId: initial.regionId ?? undefined,
        }
      : {
          code: "",
          name: "",
          discountType: "percentage",
          discountValue: 0,
          minOrderValue: undefined,
          startDate: "",
          expiryDate: "",
          usageLimitGlobal: 0,
          usageLimitPerUser: 0,
          isGlobal: true,
          isActive: true,
          regionId: undefined,
        },
  });

  const isGlobal = form.watch("isGlobal");
  const discountType = form.watch("discountType");

  const handleSubmit = async (values: CouponFormValues) => {
    const payload: GenerateCouponPayload = {
      code: values.code.trim(),
      name: values.name.trim(),
      discountType: values.discountType as DiscountType,
      discountValue: values.discountValue,
      minOrderValue: values.minOrderValue ?? 0,
      startDate: values.startDate || undefined,
      expiryDate: values.expiryDate || undefined,
      usageLimitGlobal: values.usageLimitGlobal,
      usageLimitPerUser: values.usageLimitPerUser,
      isGlobal: values.isGlobal,
      isActive: values.isActive,
      regionId: values.isGlobal ? undefined : values.regionId,
    };
    await onSubmit(payload);
  };

  return (
    <SheetContent className="overflow-y-auto py-6">
      <SheetHeader>
        <SheetTitle>
          {mode === "add" ? t("coupons.addCoupon") : t("coupons.editCoupon")}
        </SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4 mt-4 px-1"
            >
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coupons.code")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={t("coupons.codePlaceholder")}
                          {...field}
                          disabled={mode === "edit"}
                          maxLength={6}
                          className="pe-10 font-mono uppercase tracking-widest"
                          onChange={(e) => {
                            const next = e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, "")
                              .slice(0, 6);
                            field.onChange(next);
                          }}
                        />
                        {mode === "add" && (
                          <button
                            type="button"
                            onClick={() =>
                              field.onChange(generateCouponCode())
                            }
                            aria-label={t("coupons.generateCode")}
                            title={t("coupons.generateCode")}
                            className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coupons.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("coupons.namePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coupons.discountType")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("coupons.selectDiscountType")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISCOUNT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`coupons.discountTypeLabels.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {discountType !== "free_shipping" && (
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {discountType === "percentage"
                          ? t("coupons.discountPercentage")
                          : t("coupons.discountAmount")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="minOrderValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("coupons.minOrderValue")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value),
                          )
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
                      <FormLabel>{t("coupons.startDate")}</FormLabel>
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
                      <FormLabel>{t("coupons.expiryDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="usageLimitGlobal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("coupons.usageLimitGlobal")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value, 10),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usageLimitPerUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("coupons.usageLimitPerUser")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value, 10),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isGlobal"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true);
                          if (checked === true) {
                            form.setValue("regionId", undefined, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      {t("coupons.isGlobal")}
                    </FormLabel>
                  </FormItem>
                )}
              />

              {!isGlobal && (
                <FormField
                  control={form.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("coupons.region")}</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("coupons.selectRegion")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              {t("coupons.noRegions")}
                            </div>
                          ) : (
                            regions.map((region) => (
                              <SelectItem key={region.id} value={region.id}>
                                {region.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      {t("coupons.isActive")}
                    </FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || !form.formState.isValid}
                  className="flex-1"
                >
                  {isSaving
                    ? t("common.loading")
                    : mode === "add"
                      ? t("coupons.createCoupon")
                      : t("coupons.updateCoupon")}
                </Button>
              </div>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
}
