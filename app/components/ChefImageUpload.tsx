import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useRef } from "react";

interface ChefImageUploadProps {
  imagePreview: string;
  chefName: string;
  onImageChange: (base64: string) => void;
  error?: string;
}

export function ChefImageUpload({
  imagePreview,
  chefName,
  onImageChange,
  error,
}: ChefImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={imagePreview} alt="Chef preview" />
        <AvatarFallback>
          {chefName?.charAt(0).toUpperCase() || "CH"}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-center gap-2">
        <label
          htmlFor="image-upload"
          className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {imagePreview ? "Change Image" : "Upload Image"}
        </label>
        <input
          id="image-upload"
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <p className="text-sm text-muted-foreground">
          Upload a circular profile image for the chef.
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
