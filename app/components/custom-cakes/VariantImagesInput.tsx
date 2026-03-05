import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useCakeStore } from "@/stores/imageStore";
import { useShapeStore } from "@/stores/shapeStore";
import { X } from "lucide-react";

interface VariantImageData {
  shapeId: string;
  sideViewUrl: string;
  frontViewUrl: string;
  topViewUrl: string;
}

interface VariantImagesInputProps {
  variantImages: VariantImageData[];
  onVariantImagesChange: (images: VariantImageData[]) => void;
}

export function VariantImagesInput({
  variantImages,
  onVariantImagesChange,
}: VariantImagesInputProps) {
  const { t } = useTranslation();
  const shapes = useShapeStore((state) => state.shapes);
  const fetchShapes = useShapeStore((state) => state.fetchShapes);
  const uploadCakeImage = useCakeStore((state) => state.uploadCakeImage);
  const [expandedShapeId, setExpandedShapeId] = useState<string>("");

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  const handleImageUpload = async (
    shapeId: string,
    viewType: "sideViewUrl" | "frontViewUrl" | "topViewUrl",
    images: string[],
  ) => {
    if (!shapeId || images.length === 0) {
      return;
    }

    try {
      const imageToUpload = images[0];

      // Check if it's already a URL
      if (
        !imageToUpload.startsWith("data:") &&
        !imageToUpload.startsWith("blob:")
      ) {
        const response = await fetch(imageToUpload);
        const blob = await response.blob();
        const file = new File([blob], `${viewType}-image.jpg`, {
          type: "image/jpeg",
        });

        const result = await uploadCakeImage(file);
        updateVariantImage(shapeId, viewType, result.secure_url);
      } else {
        // Handle data URL
        const response = await fetch(imageToUpload);
        const blob = await response.blob();
        const file = new File([blob], `${viewType}-image.jpg`, {
          type: "image/jpeg",
        });

        const result = await uploadCakeImage(file);
        updateVariantImage(shapeId, viewType, result.secure_url);
      }
    } catch (error) {
      console.error(`Error uploading ${viewType}:`, error);
    }
  };

  const updateVariantImage = (
    shapeId: string,
    viewType: "sideViewUrl" | "frontViewUrl" | "topViewUrl",
    url: string,
  ) => {
    const existingIndex = variantImages.findIndex((v) => v.shapeId === shapeId);

    if (existingIndex >= 0) {
      const updated = [...variantImages];
      updated[existingIndex] = {
        ...updated[existingIndex],
        [viewType]: url,
      };
      onVariantImagesChange(updated);
    } else {
      const newVariant: VariantImageData = {
        shapeId: shapeId,
        sideViewUrl: viewType === "sideViewUrl" ? url : "",
        frontViewUrl: viewType === "frontViewUrl" ? url : "",
        topViewUrl: viewType === "topViewUrl" ? url : "",
      };
      onVariantImagesChange([...variantImages, newVariant]);
    }
  };

  const removeShape = (shapeId: string) => {
    onVariantImagesChange(variantImages.filter((v) => v.shapeId !== shapeId));
    if (expandedShapeId === shapeId) {
      setExpandedShapeId("");
    }
  };

  const getVariantImage = (shapeId: string): VariantImageData | undefined => {
    return variantImages.find((v) => v.shapeId === shapeId);
  };

  return (
    <div className="space-y-3">
      {shapes.map((shape) => {
        const variant = getVariantImage(shape.id);
        const isExpanded = expandedShapeId === shape.id;
        const isComplete =
          variant &&
          variant.sideViewUrl &&
          variant.frontViewUrl &&
          variant.topViewUrl;

        return (
          <Card
            key={shape.id}
            className={
              isComplete ? "border-green-200 bg-green-50" : "border-border"
            }
          >
            <CardHeader
              className="cursor-pointer py-1 px-3"
              onClick={() => setExpandedShapeId(isExpanded ? "" : shape.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {shape.shapeUrl && (
                    <img
                      src={shape.shapeUrl}
                      alt={shape.title}
                      className="h-10 w-10 object-contain rounded bg-gray-100"
                    />
                  )}
                  <CardTitle className="text-sm">{shape.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {isComplete && (
                    <div className="text-xs text-green-600 font-medium">✓</div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeShape(shape.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-2 px-3 pb-2">
                <div className="flex gap-2 justify-center">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium mb-2">
                      {t("customCakes.sideView")}
                    </label>
                    <MultiImageUploader
                      images={variant?.sideViewUrl ? [variant.sideViewUrl] : []}
                      onImagesChange={(images) =>
                        handleImageUpload(shape.id, "sideViewUrl", images)
                      }
                      label=""
                      maxImages={1}
                      compact={true}
                      compactSize="sm"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium mb-2">
                      {t("customCakes.frontView")}
                    </label>
                    <MultiImageUploader
                      images={
                        variant?.frontViewUrl ? [variant.frontViewUrl] : []
                      }
                      onImagesChange={(images) =>
                        handleImageUpload(shape.id, "frontViewUrl", images)
                      }
                      label=""
                      maxImages={1}
                      compact={true}
                      compactSize="sm"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium mb-2">
                      {t("customCakes.topView")}
                    </label>
                    <MultiImageUploader
                      images={variant?.topViewUrl ? [variant.topViewUrl] : []}
                      onImagesChange={(images) =>
                        handleImageUpload(shape.id, "topViewUrl", images)
                      }
                      label=""
                      maxImages={1}
                      compact={true}
                      compactSize="sm"
                    />
                  </div>
                </div>

                {variant && (
                  <Button
                    type="button"
                    onClick={() =>
                      onVariantImagesChange(
                        variantImages.map((v) =>
                          v.shapeId === shape.id
                            ? {
                                shapeId: shape.id,
                                sideViewUrl: "",
                                frontViewUrl: "",
                                topViewUrl: "",
                              }
                            : v,
                        ),
                      )
                    }
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    {t("common.clear")}
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
