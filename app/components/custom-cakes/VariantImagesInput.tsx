import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { useCakeStore } from "@/stores/imageStore";
import { useShapeStore } from "@/stores/shapeStore";
import { convertToWebP } from "@/lib/image-utils";
import { UPLOAD_FOLDERS } from "@/lib/upload-folders";
import { AlertCircle, X } from "lucide-react";

interface VariantImageData {
  shapeId: string;
  slicedViewUrl: string;
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
  const variantImagesRef = useRef<VariantImageData[]>(variantImages);
  const [expandedShapeId, setExpandedShapeId] = useState<string>("");

  useEffect(() => {
    variantImagesRef.current = variantImages;
  }, [variantImages]);

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  const handleImageUpload = async (
    shapeId: string,
    viewType: "slicedViewUrl" | "frontViewUrl" | "topViewUrl",
    images: string[],
  ) => {
    if (!shapeId) {
      return;
    }

    // An empty selection is the per-image remove button firing: clear just
    // this view and keep the variant's other views intact.
    if (images.length === 0) {
      updateVariantImage(shapeId, viewType, "");
      return;
    }

    try {
      const imageToUpload = images[0];

      // Already a Cloudinary URL — pass through directly
      if (
        !imageToUpload.startsWith("data:") &&
        !imageToUpload.startsWith("blob:")
      ) {
        updateVariantImage(shapeId, viewType, imageToUpload);
        return;
      }

      const webpBlob = await convertToWebP(imageToUpload);
      const file = new File([webpBlob], `${viewType}-image.webp`, {
        type: "image/webp",
      });

      const result = await uploadCakeImage(file, UPLOAD_FOLDERS.flavorVariants);
      updateVariantImage(shapeId, viewType, result.secure_url);
    } catch (error) {
      console.error(`Error uploading ${viewType}:`, error);
    }
  };

  const updateVariantImage = (
    shapeId: string,
    viewType: "slicedViewUrl" | "frontViewUrl" | "topViewUrl",
    url: string,
  ) => {
    const current = variantImagesRef.current;
    const existingIndex = current.findIndex((v) => v.shapeId === shapeId);
    let next: VariantImageData[];

    if (existingIndex >= 0) {
      const updated = { ...current[existingIndex], [viewType]: url };
      const isEmpty =
        !updated.slicedViewUrl && !updated.frontViewUrl && !updated.topViewUrl;

      // Once every view of a shape has been cleared the variant carries no
      // images, so drop the row rather than submitting a blank one.
      next = isEmpty
        ? current.filter((_, i) => i !== existingIndex)
        : current.map((v, i) => (i === existingIndex ? updated : v));
    } else if (!url) {
      // Clearing a view of a shape that has no variant yet is a no-op.
      return;
    } else {
      next = [
        ...current,
        {
          shapeId,
          slicedViewUrl: viewType === "slicedViewUrl" ? url : "",
          frontViewUrl: viewType === "frontViewUrl" ? url : "",
          topViewUrl: viewType === "topViewUrl" ? url : "",
        },
      ];
    }

    variantImagesRef.current = next;
    onVariantImagesChange(next);
  };

  const removeShape = (shapeId: string) => {
    const next = variantImagesRef.current.filter((v) => v.shapeId !== shapeId);
    variantImagesRef.current = next;
    onVariantImagesChange(next);
    if (expandedShapeId === shapeId) {
      setExpandedShapeId("");
    }
  };

  // Read the prop, not the ref: the ref exists only so the async upload
  // handlers can see the latest list, and reading it during render would
  // show stale images when the parent updates.
  const getVariantImage = (shapeId: string): VariantImageData | undefined => {
    return variantImages.find((v) => v.shapeId === shapeId);
  };

  return (
    <div className="space-y-3">
      {shapes.map((shape) => {
        const variant = getVariantImage(shape.id);
        const isExpanded = expandedShapeId === shape.id;
        // A shape that has some but not all of its views blocks submission,
        // so flag it here rather than leaving the save button silently dead.
        const isIncomplete =
          !!variant &&
          !(
            variant.slicedViewUrl &&
            variant.frontViewUrl &&
            variant.topViewUrl
          );

        return (
          <Card
            key={shape.id}
            className={isIncomplete ? "border-destructive" : "border-border"}
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
                  {isIncomplete && (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                {isIncomplete && (
                  <p className="text-xs text-destructive mb-2 text-center">
                    {t("customCakes.variantIncomplete")}
                  </p>
                )}
                <div className="flex gap-2 justify-center">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium mb-2">
                      {t("customCakes.sideView")}
                    </label>
                    <MultiImageUploader
                      images={
                        variant?.slicedViewUrl ? [variant.slicedViewUrl] : []
                      }
                      onImagesChange={(images) =>
                        handleImageUpload(shape.id, "slicedViewUrl", images)
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
                                slicedViewUrl: "",
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
