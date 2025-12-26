import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { ChefImageUpload } from "@/components/ChefImageUpload";
import { BakerySelect } from "@/components/BakerySelect";

import { chefFormSchema as formSchema } from "@/schemas/chefFormSchema";

interface AddChefProps {
  bakeries: string[];
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
}

const AddChef = ({ bakeries, onSubmit }: AddChefProps) => {
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      bakery: "",
      image: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit?.(data);
    form.reset();
    setImagePreview("");
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Chef</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              {/* Only one ChefImageUpload, not wrapped in extra divs */}
              <ChefImageUpload
                imagePreview={imagePreview}
                chefName={form.getValues("name")}
                onImageChange={(base64) => {
                  setImagePreview(base64);
                  form.setValue("image", base64);
                }}
                error={form.formState.errors.image?.message}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chef Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter chef name" {...field} />
                    </FormControl>
                    <FormDescription>The chef's full name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <BakerySelect bakeries={bakeries} control={form.control} />

              <Button
                type="submit"
                className="w-full"
                disabled={bakeries.length === 0}
              >
                Add Chef
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddChef;
