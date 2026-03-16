import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, Calendar, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { DayPicker } from "react-day-picker";
import { useConfigStore } from "@/stores/configStore";
import { format, parse } from "date-fns";
import type { UpdateConfigRequest } from "@/lib/services/config.service";

const formSchema = z.object({
  openingHour: z.number().int().min(0).max(23),
  closingHour: z.number().int().min(0).max(23),
  minHoursToPrepare: z.number().int().min(1),
  weekendDays: z.array(z.number().int().min(0).max(6)),
  holidays: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

const DAYS_OF_WEEK = [
  { value: 0, key: "sunday" },
  { value: 1, key: "monday" },
  { value: 2, key: "tuesday" },
  { value: 3, key: "wednesday" },
  { value: 4, key: "thursday" },
  { value: 5, key: "friday" },
  { value: 6, key: "saturday" },
];

export default function AppConfigPage() {
  const { t } = useTranslation();
  const config = useConfigStore((state) => state.config);
  const isLoading = useConfigStore((state) => state.isLoading);
  const isSaving = useConfigStore((state) => state.isSaving);
  const error = useConfigStore((state) => state.error);
  const fetchConfig = useConfigStore((state) => state.fetchConfig);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  const clearError = useConfigStore((state) => state.clearError);

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const isInitializedRef = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      openingHour: 10,
      closingHour: 18,
      minHoursToPrepare: 24,
      weekendDays: [5, 6],
      holidays: [],
    },
  });

  // Fetch config on component mount (store handles caching)
  useEffect(() => {
    fetchConfig();
  }, []);

  // Update form when config is loaded
  useEffect(() => {
    if (config) {
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        form.reset({
          openingHour: config.openingHour,
          closingHour: config.closingHour,
          minHoursToPrepare: config.minHoursToPrepare,
          weekendDays: config.weekendDays,
          holidays: config.holidays,
        });

        // Convert holidays to dates for calendar
        const dates = config.holidays.map((dateStr) => {
          const date = parse(dateStr, "yyyy-MM-dd", new Date());
          return date;
        });
        // eslint-disable-next-line react-hooks/rules-of-hooks
        setSelectedDates(dates);
      }
    }
  }, [config]);

  const onSubmit = async (values: FormValues) => {
    try {
      const updateData: UpdateConfigRequest = {
        openingHour: values.openingHour,
        closingHour: values.closingHour,
        minHoursToPrepare: values.minHoursToPrepare,
        weekendDays: values.weekendDays,
        holidays: values.holidays,
        // These fields are not managed by the form UI
        emergencyClosures: [],
        isOpen: true,
        closureMessage: null,
      };

      await updateConfig(updateData);
    } catch (error) {
      console.error("Failed to update config:", error);
    }
  };

  const handleReset = () => {
    if (config) {
      form.reset({
        openingHour: config.openingHour,
        closingHour: config.closingHour,
        minHoursToPrepare: config.minHoursToPrepare,
        weekendDays: config.weekendDays,
        holidays: config.holidays,
      });
      const holidaysAsDate = config.holidays.map((h) =>
        parse(h, "yyyy-MM-dd", new Date()),
      );
      setSelectedDates(holidaysAsDate);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDates((prev) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const exists = prev.some((d) => format(d, "yyyy-MM-dd") === dateStr);

      let newDates: Date[];
      if (exists) {
        newDates = prev.filter((d) => format(d, "yyyy-MM-dd") !== dateStr);
      } else {
        newDates = [...prev, date];
      }

      // Update form value
      const holidayStrings = newDates.map((d) => format(d, "yyyy-MM-dd"));
      form.setValue("holidays", holidayStrings);

      return newDates;
    });
  };

  if (isLoading && !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("appConfig.title")}</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">
              {t("common.error")}
            </h3>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
            <button
              onClick={clearError}
              className="text-sm text-destructive hover:text-destructive/80 mt-2 underline"
            >
              {t("common.dismiss")}
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Operating Hours & Preparation Time Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t("appConfig.operatingHours")}
              </h2>
              <div className="flex gap-6 flex-wrap">
                <FormField
                  control={form.control}
                  name="openingHour"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-48">
                      <FormLabel>{t("appConfig.openingHour")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("appConfig.openingHour")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closingHour"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-48">
                      <FormLabel>{t("appConfig.closingHour")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("appConfig.closingHour")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minHoursToPrepare"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-48">
                      <FormLabel>{t("appConfig.minHoursToPrepare")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("appConfig.preparationTime")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Weekend Days Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t("appConfig.weekendDays")}
              </h2>
              <FormField
                control={form.control}
                name="weekendDays"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {DAYS_OF_WEEK.map((day) => (
                        <FormItem
                          key={day.value}
                          className="flex items-center space-x-2"
                        >
                          <FormControl>
                            <Checkbox
                              checked={
                                field.value?.includes(day.value) || false
                              }
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange(
                                    [...current, day.value].sort(),
                                  );
                                } else {
                                  field.onChange(
                                    current.filter((d) => d !== day.value),
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer font-normal">
                            {t(`appConfig.${day.key}`)}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Holidays Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t("appConfig.holidays")}
              </h2>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-auto lg:flex-[0_0_auto] space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    {t("appConfig.chooseHolidayDates")}
                  </div>
                  <div className="border border-border rounded-lg p-4 bg-muted">
                    <DayPicker
                      mode="multiple"
                      selected={selectedDates}
                      onDayClick={handleDateSelect}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      className="scale-95 origin-top-left"
                    />
                  </div>
                </div>

                <div className="w-full lg:flex-1 space-y-3">
                  <p className="text-sm font-medium">
                    {t("appConfig.selectedHolidays")} ({selectedDates.length})
                  </p>
                  <div className="border border-border rounded-lg p-4 bg-muted max-h-96 overflow-y-auto space-y-2">
                    {selectedDates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("appConfig.noHolidaysSelected")}
                      </p>
                    ) : (
                      selectedDates.sort().map((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const displayStr = format(date, "EEEE, MMMM d, yyyy");
                        return (
                          <div
                            key={dateStr}
                            className="flex items-center bg-card p-2 rounded border border-border"
                          >
                            <span className="text-sm">{displayStr}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? t("appConfig.saving") : t("appConfig.save")}
              </Button>
              {(form.formState.isDirty || selectedDates.length > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {t("common.reset") || "Reset"}
                </Button>
              )}
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
