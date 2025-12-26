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
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ChefImageUpload } from "@/components/ChefImageUpload";
import { BakerySelect } from "@/components/BakerySelect";

type Chef = {
  id: string;
  name: string;
  image: string;
  bakery: string;
  rating: number;
};

import { chefFormSchema as formSchema } from "@/schemas/chefFormSchema";

interface EditChefProps {
  chef: Chef;
  bakeries: string[];
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
}

const EditChef = ({ chef, bakeries, onSubmit }: EditChefProps) => {
  const [imagePreview, setImagePreview] = useState<string>(chef.image);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: chef.name,
      bakery: chef.bakery,
      image: chef.image,
    },
  });

  useEffect(() => {
    form.reset({
      name: chef.name,
      bakery: chef.bakery,
      image: chef.image,
    });
    setImagePreview(chef.image);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chef.id]);

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit?.(data);
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Edit Chef</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
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

              {bakeries.length === 0 && (
                <div className="text-center text-sm text-muted-foreground mb-2">
                  No bakeries available. Please add a bakery first.
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={bakeries.length === 0}
              >
                Update Chef
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default EditChef;
