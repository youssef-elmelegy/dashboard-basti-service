import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useTagsStore } from "@/stores/tagsStore";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import { TAG_TYPES, type TagType } from "@/lib/services/tags.service";
import type { Tag } from "@/lib/services/tags.service";

const formSchema = z.object({
  name: z.string().min(2).max(100),
  displayOrder: z.coerce
    .number()
    .int()
    .min(0, "Display order must be a valid number"),
  types: z
    .array(z.enum(["sweets", "decorations", "predesigned-cakes", "addons"]))
    .min(1, "Select at least one type"),
});

type FormValues = z.infer<typeof formSchema>;

export default function TagsManagementPage() {
  const { t } = useTranslation();
  const tags = useTagsStore((s) => s.tags);
  const isLoading = useTagsStore((s) => s.isLoading);
  const isSaving = useTagsStore((s) => s.isSaving);
  const error = useTagsStore((s) => s.error);
  const fetchTags = useTagsStore((s) => s.fetchTags);
  const createTag = useTagsStore((s) => s.createTag);
  const updateTag = useTagsStore((s) => s.updateTag);
  const deleteTag = useTagsStore((s) => s.deleteTag);
  const changeTagOrder = useTagsStore((s) => s.changeTagOrder);
  const clearError = useTagsStore((s) => s.clearError);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedTag, setDraggedTag] = useState<Tag | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues, unknown>,
    defaultValues: {
      name: "",
      displayOrder: 0,
      types: [],
    },
  });

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (editingId) {
      const tag = tags.find((t) => t.id === editingId);
      if (tag) {
        form.reset({
          name: tag.name,
          displayOrder: tag.displayOrder,
          types: tag.types || [],
        });
      }
    } else {
      form.reset({ name: "", displayOrder: 0, types: [] });
    }
  }, [editingId]);

  // Validate that displayOrder is unique among tags (exclude current editing tag)
  const watchedDisplayOrder = form.watch("displayOrder");
  useEffect(() => {
    const value = watchedDisplayOrder;
    if (typeof value !== "number" || Number.isNaN(value)) {
      form.clearErrors("displayOrder");
      return;
    }

    const conflict = tags.some(
      (t) => t.displayOrder === value && t.id !== editingId,
    );
    if (conflict) {
      form.setError("displayOrder", {
        type: "manual",
        message: t("tags.displayOrderExists") || "Display order already in use",
      });
    } else {
      form.clearErrors("displayOrder");
    }
  }, [watchedDisplayOrder, tags, editingId]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingId) {
        const updated = await updateTag(editingId, values);
        if (!updated) {
          // read latest store error (may contain API message)
          const storeErr = useTagsStore.getState().error;
          form.setError("name", {
            type: "manual",
            message: storeErr || t("tags.saveFailed") || "Failed to update tag",
          });
          return;
        }
        setEditingId(null);
      } else {
        const created = await createTag(values);
        if (!created) {
          const storeErr = useTagsStore.getState().error;
          form.setError("name", {
            type: "manual",
            message:
              storeErr || t("tags.createFailed") || "Failed to create tag",
          });
          return;
        }
      }

      // clear any previous errors and reset form on success
      clearError();
      form.reset({ name: "", displayOrder: 0, types: [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      form.setError("name", { type: "manual", message: msg });
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const { openDeleteDialog } = useDeleteDialog();

  const handleDelete = (tag: { id: string; name: string }) => {
    openDeleteDialog(
      {
        title: t("tags.deleteTitle") || "Delete tag",
        description: (
          <>
            {t("tags.deleteDescription")} <strong>{tag.name}</strong>?{" "}
            {t("common.cannotBeUndone")}
          </>
        ),
        recordName: tag.name,
        recordType: t("tags.recordType") || "tag",
      },
      async () => {
        try {
          await deleteTag(tag.id);
        } catch (err) {
          console.error("Failed to delete tag:", err);
        }
      },
    );
  };

  const handleDragStart = (tag: Tag) => {
    setDraggedTag(tag);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDraggedTag(null);
    setDragOverId(null);
  };

  const handleDrop = async (targetTag: Tag) => {
    if (!draggedTag || draggedTag.id === targetTag.id) {
      setDraggedTag(null);
      return;
    }

    // Find positions
    const displayedTags = [...tags].sort((a, b) => a.displayOrder - b.displayOrder);
    const draggedIndex = displayedTags.findIndex((t) => t.id === draggedTag.id);
    const targetIndex = displayedTags.findIndex((t) => t.id === targetTag.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTag(null);
      return;
    }

    // Calculate new order (1-indexed)
    const newOrder = targetIndex + 1;

    // Send request to update backend (fire-and-forget).
    // The store performs an optimistic update immediately and will rollback on error.
    changeTagOrder(draggedTag.id, newOrder).catch((error) => {
      console.error("Failed to change tag order:", error);
    });

    // Clear drag state immediately so UI is responsive
    setDraggedTag(null);
  };

  // Compute displayed tags sorted by order
  const displayedTags = [...tags].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="h-full flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("tags.title") || "Tags"}</h1>
      </div>

      {error && (
        <div className="rounded-lg p-4 flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">
              {t("common.error")}
            </h3>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
            <button onClick={clearError} className="text-sm underline mt-2">
              {t("common.dismiss")}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg p-6 flex-1 flex flex-col">
        <div className="grid md:grid-cols-3 gap-6 h-full">
          <div className="md:col-span-1 h-full">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 h-full"
              >
                <FormField<FormValues, "name">
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tags.name") || "Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<FormValues, "displayOrder">
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("tags.displayOrder") || "Display Order"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter display order"
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value, 10) : 0,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<FormValues, "types">
                  control={form.control}
                  name="types"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t("tags.types") || "Types"}</FormLabel>
                      <div className="space-y-2">
                        {TAG_TYPES.map((type) => (
                          <FormField<FormValues, "types">
                            key={type}
                            control={form.control}
                            name="types"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={
                                      Array.isArray(field.value) &&
                                      field.value.includes(type as TagType)
                                    }
                                    onCheckedChange={(checked) => {
                                      const currentValue = Array.isArray(
                                        field.value,
                                      )
                                        ? field.value
                                        : [];
                                      const updated = checked
                                        ? [...currentValue, type as TagType]
                                        : currentValue.filter(
                                            (v) => v !== type,
                                          );
                                      field.onChange(updated);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize cursor-pointer">
                                  {type.replace(/-/g, " ")}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 items-center">
                  <Button
                    type="submit"
                    className="gap-2"
                    disabled={
                      isLoading ||
                      isSaving ||
                      !!form.formState.errors.displayOrder
                    }
                  >
                    <Save className="w-4 h-4" />{" "}
                    {editingId ? t("common.save") : t("common.create")}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>

          <div className="md:col-span-2 h-full">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">
                  {t("tags.list") || "Available Tags"}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {tags.length} items
                </div>
              </div>

              <div className="rounded-lg p-2 h-full overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : tags.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No tags
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {displayedTags.map((tag) => (
                      <li
                        key={tag.id}
                        draggable
                        onDragStart={() => handleDragStart(tag)}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragEnter={() => setDragOverId(tag.id)}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={() => handleDrop(tag)}
                        className={`
                          cursor-grab active:cursor-grabbing transition-all flex items-center justify-between p-3 rounded bg-slate-100 dark:bg-slate-800
                          ${draggedTag?.id === tag.id 
                            ? "opacity-50 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-500" 
                            : ""}
                          ${dragOverId === tag.id && draggedTag?.id !== tag.id
                            ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500"
                            : ""}
                          ${draggedTag?.id !== tag.id && dragOverId !== tag.id
                            ? "hover:bg-slate-200 dark:hover:bg-slate-700"
                            : ""}
                        `}
                      >
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Order: {tag.displayOrder}
                          </div>
                          {Array.isArray(tag.types) &&
                            tag.types.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-2">
                                {tag.types.map((type) => (
                                  <Badge key={type} variant="secondary">
                                    {type.replace(/-/g, " ")}
                                  </Badge>
                                ))}
                              </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(tag.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(tag)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
