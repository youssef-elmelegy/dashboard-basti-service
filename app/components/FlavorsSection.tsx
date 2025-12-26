import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Control, FieldValues, Path } from "react-hook-form";

interface FlavorsSectionProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[];
  fieldName: string;
  onAppend: () => void;
  onRemove: (index: number) => void;
}

export function FlavorsSection<T extends FieldValues = FieldValues>({
  control,
  fields,
  fieldName,
  onAppend,
  onRemove,
}: FlavorsSectionProps<T>) {
  type DynamicPath = Path<T>;
  const getFieldName = (index: number): DynamicPath => {
    return `${fieldName}.${index}` as DynamicPath;
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-base">Flavors</FormLabel>
        <Button type="button" variant="outline" size="sm" onClick={onAppend}>
          + Add Flavor
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <FormField
              control={control}
              name={getFieldName(index)}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="e.g., Vanilla" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
