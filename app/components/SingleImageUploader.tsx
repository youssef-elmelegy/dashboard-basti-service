import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SingleImageUploaderProps {
  imageUrl?: string;
  onImageChange: (imageUrl: string | undefined) => void;
  isLoading?: boolean;
  label?: string;
}

export function SingleImageUploader({
  imageUrl,
  onImageChange,
  isLoading = false,
  label,
}: SingleImageUploaderProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(imageUrl);

  // Update preview when imageUrl prop changes (e.g., when editing)
  useEffect(() => {
    setPreview(imageUrl);
  }, [imageUrl]);

  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    // Read file as data URL and pass to parent for handling
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onImageChange(dataUrl);
    };
    reader.readAsDataURL(file);
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

  const removeImage = () => {
    setPreview(undefined);
    onImageChange(undefined);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Image Preview */}
      {preview && (
        <div className="relative w-fit">
          <img
            src={preview}
            alt="Option preview"
            className="max-w-xs max-h-48 object-contain rounded-lg border border-border"
          />
          <button
            type="button"
            onClick={removeImage}
            disabled={isLoading}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 disabled:opacity-50"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!preview && (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center cursor-pointer transition-colors w-full px-4 py-6 border-2 border-dashed rounded-lg ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex flex-col items-center justify-center py-2">
            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">{t("common.uploadImage")}</p>
            <p className="text-xs text-muted-foreground">
              {t("common.imageFormats")}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            disabled={isLoading}
            onChange={(e) => handleImageUpload(e.target.files)}
          />
        </label>
      )}

      {isLoading && (
        <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
      )}
    </div>
  );
}
