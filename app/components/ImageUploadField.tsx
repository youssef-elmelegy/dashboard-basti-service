import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Upload, RotateCw } from "lucide-react";
import { useState } from "react";

interface ImageUploadFieldProps {
  label?: string;
  onImageChange: (base64: string) => void;
  initialImage?: string;
}

export function ImageUploadField({
  label = "Image",
  onImageChange,
  initialImage = "",
}: ImageUploadFieldProps) {
  const [imagePreview, setImagePreview] = useState<string>(initialImage);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        onImageChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <div className="flex flex-col gap-3">
          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          ) : (
            <label className="relative w-full h-48 rounded-lg overflow-hidden border border-border cursor-pointer group">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm">
                  Replace Image
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
