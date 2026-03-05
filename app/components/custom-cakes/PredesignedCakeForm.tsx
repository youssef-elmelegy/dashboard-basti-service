"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
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
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X } from "lucide-react";
import {
  createPredesignedCakeSchema,
  updatePredesignedCakeSchema,
  type CreatePredesignedCakeFormValues,
  type UpdatePredesignedCakeFormValues,
} from "@/schemas/custom-cakes.schema";
import { useFlavorStore } from "@/stores/flavorStore";
import { useShapeStore } from "@/stores/shapeStore";
import { useDecorationStore } from "@/stores/decorationStore";
import { useTagsStore } from "@/stores/tagsStore";
import type {
  PredesignedCake,
  DesignedCakeConfigRequestDto,
} from "@/lib/services/predesigned-cake.service";
import type { Flavor } from "@/lib/services/flavor.service";
import type { Shape } from "@/lib/services/shape.service";
import type { Decoration } from "@/lib/services/decoration.service";

interface PredesignedCakeFormProps {
  initialData?: PredesignedCake;
  onSubmit: (
    data: CreatePredesignedCakeFormValues | UpdatePredesignedCakeFormValues,
  ) => Promise<void>;
  isLoading?: boolean;
}

export function PredesignedCakeForm({
  initialData,
  onSubmit,
  isLoading = false,
}: PredesignedCakeFormProps) {
  const { t } = useTranslation();
  const flavors = useFlavorStore((s) => s.flavors);
  const shapes = useShapeStore((s) => s.shapes);
  const decorations = useDecorationStore((s) => s.decorations);
  const tags = useTagsStore((s) => s.tags);

  const fetchFlavors = useFlavorStore((s) => s.fetchFlavors);
  const fetchShapes = useShapeStore((s) => s.fetchShapes);
  const fetchDecorations = useDecorationStore((s) => s.fetchDecorations);
  const fetchTags = useTagsStore((s) => s.fetchTags);

  const [configs, setConfigs] = useState<DesignedCakeConfigRequestDto[]>(
    initialData?.configs?.map((c) => ({
      flavorId: c.flavor.id,
      decorationId: c.decoration.id,
      shapeId: c.shape.id,
      frostColorValue: c.frostColorValue,
    })) || [],
  );

  const schema = initialData
    ? updatePredesignedCakeSchema
    : createPredesignedCakeSchema;

  const form = useForm<
    CreatePredesignedCakeFormValues | UpdatePredesignedCakeFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      tagId: initialData?.tagId || "",
      configs: configs,
    },
  });

  useEffect(() => {
    fetchFlavors();
    fetchShapes();
    fetchDecorations();
    fetchTags();
  }, [fetchFlavors, fetchShapes, fetchDecorations, fetchTags]);

  const addConfig = (newConfig: DesignedCakeConfigRequestDto) => {
    setConfigs([...configs, newConfig]);
  };

  const removeConfig = (index: number) => {
    const updated = configs.filter((_, i) => i !== index);
    setConfigs(updated);
  };

  const handleSubmit = async (
    data: CreatePredesignedCakeFormValues | UpdatePredesignedCakeFormValues,
  ) => {
    if (configs.length === 0) {
      form.setError("root", {
        message: t("customCakes.predesignedCakes.addAtLeastOneConfig"),
      });
      return;
    }
    await onSubmit({ ...data, configs });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {form.formState.errors.root && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {form.formState.errors.root.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t(
                    "customCakes.predesignedCakes.namePlaceholder",
                  )}
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
              <FormLabel>{t("common.description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t(
                    "customCakes.predesignedCakes.descriptionPlaceholder",
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tagId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("customCakes.tag")} (Optional)</FormLabel>
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("customCakes.predesignedCakes.configurations")}
            </h3>
            <ConfigurationSelector
              flavors={flavors}
              shapes={shapes}
              decorations={decorations}
              onAdd={addConfig}
            />
          </div>

          {configs.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">
                {t("customCakes.predesignedCakes.noConfigs")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config, index) => {
                const flavor = flavors.find((f) => f.id === config.flavorId);
                const shape = shapes.find((s) => s.id === config.shapeId);
                const decoration = decorations.find(
                  (d) => d.id === config.decorationId,
                );

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {flavor?.title || "Unknown"} +{" "}
                        {decoration?.title || "Unknown"} +{" "}
                        {shape?.title || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">
                          {t("customCakes.predesignedCakes.color")}:
                        </span>
                        <div
                          className="h-5 w-5 rounded border border-gray-300"
                          style={{ backgroundColor: config.frostColorValue }}
                        />
                        <span className="text-xs font-mono text-gray-600">
                          {config.frostColorValue}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConfig(index)}
                      className="rounded-md p-1 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? t("common.loading")
            : initialData
              ? t("common.update")
              : t("common.create")}
        </Button>
      </form>
    </Form>
  );
}

interface ConfigurationSelectorProps {
  flavors: Flavor[];
  shapes: Shape[];
  decorations: Decoration[];
  onAdd: (config: DesignedCakeConfigRequestDto) => void;
}

function ConfigurationSelector({
  flavors,
  shapes,
  decorations,
  onAdd,
}: ConfigurationSelectorProps) {
  const { t } = useTranslation();
  const [flavorId, setFlavorId] = useState("");
  const [shapeId, setShapeId] = useState("");
  const [decorationId, setDecorationId] = useState("");
  const [frostColor, setFrostColor] = useState("#DC143C");
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (flavorId && shapeId && decorationId) {
      onAdd({
        flavorId,
        shapeId,
        decorationId,
        frostColorValue: frostColor,
      });
      setFlavorId("");
      setShapeId("");
      setDecorationId("");
      setFrostColor("#DC143C");
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        {t("customCakes.predesignedCakes.addConfig")}
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">
          {t("customCakes.predesignedCakes.addConfig")}
        </h4>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">{t("customCakes.flavor")}</Label>
          <Select value={flavorId} onValueChange={setFlavorId}>
            <SelectTrigger>
              <SelectValue placeholder={t("customCakes.selectFlavor")} />
            </SelectTrigger>
            <SelectContent>
              {flavors.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">{t("customCakes.decoration")}</Label>
          <Select value={decorationId} onValueChange={setDecorationId}>
            <SelectTrigger>
              <SelectValue placeholder={t("customCakes.selectDecoration")} />
            </SelectTrigger>
            <SelectContent>
              {decorations.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">{t("customCakes.shape")}</Label>
          <Select value={shapeId} onValueChange={setShapeId}>
            <SelectTrigger>
              <SelectValue placeholder={t("customCakes.selectShape")} />
            </SelectTrigger>
            <SelectContent>
              {shapes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">
            {t("customCakes.predesignedCakes.frostColor")}
          </Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={frostColor}
              onChange={(e) => setFrostColor(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-gray-300"
            />
            <Input
              value={frostColor}
              onChange={(e) => setFrostColor(e.target.value)}
              placeholder="#DC143C"
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleAdd}
        size="sm"
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        {t("common.add")}
      </Button>
    </div>
  );
}
