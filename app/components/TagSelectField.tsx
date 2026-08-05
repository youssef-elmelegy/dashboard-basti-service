import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTagsStore } from "@/stores/tagsStore";
import type { TagType } from "@/lib/services/tags.service";
import { cn } from "@/lib/utils";

interface TagSelectFieldProps {
  value?: string | null;
  onChange: (value: string) => void;
  /** Only tags carrying this type are offered. */
  tagType: TagType;
  /**
   * The record still points at a tag that was deleted. The picker cannot render
   * that value (it is gone from the list), so without this the field just looks
   * blank and the admin has no idea why. Set from the API's `tagMissing` flag.
   */
  tagMissing?: boolean;
}

/**
 * Tag picker shared by the product forms.
 *
 * Kept in one place so the deleted-tag warning behaves identically everywhere —
 * each form used to carry its own copy of this component.
 */
export function TagSelectField({
  value,
  onChange,
  tagType,
  tagMissing = false,
}: TagSelectFieldProps) {
  const { t } = useTranslation();
  const tags = useTagsStore((state) => state.tags);

  return (
    <div className="space-y-2">
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            tagMissing &&
              "border-amber-400 ring-1 ring-amber-300 dark:border-amber-600",
          )}
        >
          <SelectValue placeholder={t("common.selectTagPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {tags
            .filter(
              (tag) => Array.isArray(tag.types) && tag.types.includes(tagType),
            )
            .map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {tagMissing && (
        <p className="text-sm rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          {t("common.tagDeletedPickAnother")}
        </p>
      )}
    </div>
  );
}
