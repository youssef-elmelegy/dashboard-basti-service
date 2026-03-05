import { useState } from "react";
import { Upload, X } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslation } from "react-i18next";

interface MultiImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  label?: string;
  description?: string;
  error?: string;
  maxImages?: number;
  compact?: boolean;
  compactSize?: "sm" | "md" | "lg";
}

export function MultiImageUploader({
  images,
  onImagesChange,
  label = "Images",
  description,
  error,
  maxImages = 5,
  compact = false,
  compactSize = "md",
}: MultiImageUploaderProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);

  // Size mappings for compact mode
  const sizeClasses = {
    sm: {
      box: "w-20 h-20",
      icon: "w-3 h-3",
      uploadIcon: "w-4 h-4",
      gap: "gap-1",
    },
    md: {
      box: "w-24 h-24",
      icon: "w-3 h-3",
      uploadIcon: "w-4 h-4",
      gap: "gap-2",
    },
    lg: {
      box: "w-32 h-32",
      icon: "w-4 h-4",
      uploadIcon: "w-6 h-6",
      gap: "gap-3",
    },
  };

  const currentSize = compact ? sizeClasses[compactSize] : null;

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages: string[] = [...images];
    const remainingSlots = maxImages - newImages.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          newImages.push(base64String);
          onImagesChange(newImages);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const canAddMore = images.length < maxImages;

  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <div className={compact ? "space-y-2" : "space-y-4"}>
          {/* Images Grid */}
          {images.length > 0 && (
            <div
              className={
                compact ? `flex ${currentSize?.gap}` : "grid grid-cols-3 gap-3"
              }
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`relative group ${
                    compact ? `${currentSize?.box} shrink-0` : ""
                  }`}
                >
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className={`w-full h-full object-cover rounded-lg border border-border`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    {t("common.image")} {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Area */}
          {canAddMore && (
            <label
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${
                compact
                  ? `${currentSize?.box} border-2 border-dashed rounded-lg px-2 py-2`
                  : "w-full px-4 py-6 border-2 border-dashed rounded-lg"
              } ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div
                className={`flex flex-col items-center justify-center ${
                  compact ? "pt-2 pb-2" : "pt-5 pb-6"
                }`}
              >
                <Upload
                  className={`text-muted-foreground mb-1 ${
                    compact ? currentSize?.uploadIcon : "w-8 h-8"
                  }`}
                />
                {!compact && (
                  <>
                    <p className="text-sm font-medium">
                      {t("common.uploadImage")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("common.imageFormats")}
                    </p>
                  </>
                )}
                {images.length > 0 && !compact && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {images.length} / {maxImages} {t("common.uploaded")}
                  </p>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
              />
            </label>
          )}

          {images.length === 0 && !compact && (
            <p className="text-xs text-destructive">
              {t("common.imageRequired")}
            </p>
          )}
        </div>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
}
