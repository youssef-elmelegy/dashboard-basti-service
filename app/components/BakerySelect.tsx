import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Control, FieldValues, Path } from "react-hook-form";

interface BakerySelectProps<T extends FieldValues = FieldValues> {
  bakeries: string[];
  control: Control<T>;
  name?: Path<T>;
  label?: string;
  description?: string;
}

function BakerySelect<T extends FieldValues = FieldValues>({
  bakeries,
  control,
  name = "bakery" as Path<T>,
  label = "Bakery",
  description = "Select the bakery this chef works at.",
}: BakerySelectProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={bakeries.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a bakery" />
              </SelectTrigger>
              <SelectContent>
                {bakeries.length === 0 ? (
                  <div className="px-4 py-2 text-muted-foreground text-sm">
                    No bakeries available. Please add a bakery first.
                  </div>
                ) : (
                  bakeries.map((bakery) => (
                    <SelectItem key={bakery} value={bakery}>
                      {bakery}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export { BakerySelect };
