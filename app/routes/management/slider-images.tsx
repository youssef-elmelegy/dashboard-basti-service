import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SliderImageCard } from "@/components/SliderImageCard";
import { SliderImageForm } from "@/components/SliderImageForm";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import { useSliderImageStore } from "@/stores/sliderImageStore";
import { tagsApi } from "@/lib/services/tags.service";
import type { SliderImage } from "@/lib/services/slider-image.service";
import type { SliderImageItem } from "@/lib/services/slider-image.service";
import type { Tag } from "@/lib/services/tags.service";

type SliderImageFormValues = {
  title: string;
  imageUrl: string;
  tagId?: string;
};

export default function SliderImagesPage() {
  const { t } = useTranslation();
  const sliderImages = useSliderImageStore((state) => state.sliderImages);
  const isLoading = useSliderImageStore((state) => state.isLoading);
  const error = useSliderImageStore((state) => state.error);
  const fetchSliderImages = useSliderImageStore(
    (state) => state.fetchSliderImages,
  );
  const updateSliderImages = useSliderImageStore(
    (state) => state.updateSliderImages,
  );
  const deleteSliderImage = useSliderImageStore(
    (state) => state.deleteSliderImage,
  );
  const clearError = useSliderImageStore((state) => state.clearError);

  const { openDeleteDialog } = useDeleteDialog();

  const [selectedImage, setSelectedImage] = useState<SliderImage | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setTagsLoading(true);
        const response = await tagsApi.getAll();
        if (response.data) {
          setTags(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      } finally {
        setTagsLoading(false);
      }
    };
    fetchTags();
  }, []);
  useEffect(() => {
    fetchSliderImages();
  }, [fetchSliderImages]);

  const handleAddSliderImage = async (values: SliderImageFormValues) => {
    try {
      // Create new array with existing images + new image
      // Auto-assign displayOrder based on existing images count
      const displayOrder = sliderImages.length + 1;
      const newImages: SliderImageItem[] = [
        ...sliderImages.map((img) => ({
          title: img.title,
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder,
          tagId: img.tagId,
        })),
        {
          ...values,
          displayOrder,
        },
      ];
      await updateSliderImages(newImages);
      setIsAddOpen(false);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to add slider image";
      console.error("Failed to add slider image:", errorMsg);
    }
  };

  const handleUpdateSliderImage = async (values: SliderImageFormValues) => {
    if (selectedImage) {
      try {
        // Get displayOrder from selected tag, or keep existing displayOrder
        let displayOrder = selectedImage.displayOrder;
        if (values.tagId) {
          const selectedTag = tags.find((tag) => tag.id === values.tagId);
          if (selectedTag) {
            displayOrder = selectedTag.displayOrder;
          }
        }

        // Create new array with updated image
        const newImages: SliderImageItem[] = sliderImages.map((img) =>
          img.id === selectedImage.id
            ? {
                ...values,
                displayOrder,
              }
            : {
                title: img.title,
                imageUrl: img.imageUrl,
                displayOrder: img.displayOrder,
                tagId: img.tagId,
              },
        );
        await updateSliderImages(newImages);
        setSelectedImage(null);
        setIsEditOpen(false);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update slider image";
        console.error("Failed to update slider image:", errorMsg);
      }
    }
  };

  const handleDeleteSliderImage = (image: SliderImage) => {
    openDeleteDialog(
      {
        recordName: image.title,
        recordType: t("sliderImages.recordType"),
        title: t("sliderImages.deleteConfirm"),
        description: `${t("sliderImages.deleteMessage")} ${image.title}? ${t("common.cannotBeUndone")}`,
      },
      async () => {
        try {
          await deleteSliderImage(image.id);
        } catch (err) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : "Failed to delete slider image";
          console.error("Failed to delete slider image:", errorMsg);
        }
      },
    );
  };

  // Get list of tagIds that are already used in other images
  const getUsedTagIds = (excludeImageId?: string) => {
    return sliderImages
      .filter((img) => img.id !== excludeImageId && img.tagId)
      .map((img) => img.tagId!);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/management">
                {t("sidebar.management")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("sliderImages.title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("sliderImages.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("sliderImages.description")}
            </p>
          </div>
          <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2" disabled={isLoading}>
                <Plus className="w-4 h-4" />
                {t("sliderImages.addSliderImage")}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto py-6">
              <SheetHeader>
                <SheetTitle>{t("sliderImages.addNewSliderImage")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <SliderImageForm
                  onSubmit={handleAddSliderImage}
                  isLoading={isLoading || tagsLoading}
                  tags={tags}
                  usedTagIds={getUsedTagIds()}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">{t("common.error")}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={clearError}
              className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
            >
              {t("common.dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && sliderImages.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      ) : sliderImages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sliderImages.map((image) => (
            <Sheet
              key={image.id}
              open={isEditOpen && selectedImage?.id === image.id}
              onOpenChange={setIsEditOpen}
            >
              <SliderImageCard
                image={image}
                onEdit={(img) => {
                  setSelectedImage(img);
                  setIsEditOpen(true);
                }}
                onDelete={() => handleDeleteSliderImage(image)}
              />
              {selectedImage && (
                <SheetContent className="overflow-y-auto py-6">
                  <SheetHeader>
                    <SheetTitle>{t("sliderImages.editSliderImage")}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <SliderImageForm
                      image={selectedImage}
                      onSubmit={handleUpdateSliderImage}
                      isLoading={isLoading || tagsLoading}
                      tags={tags}
                      usedTagIds={getUsedTagIds(selectedImage?.id)}
                    />
                  </div>
                </SheetContent>
              )}
            </Sheet>
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span className="text-3xl">🎞️</span>
            </EmptyMedia>
            <EmptyTitle>{t("sliderImages.noSliderImages")}</EmptyTitle>
            <EmptyDescription>
              {t("sliderImages.noSliderImagesYet")}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("sliderImages.createSliderImage")}
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto py-6">
                <SheetHeader>
                  <SheetTitle>{t("sliderImages.addNewSliderImage")}</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SliderImageForm
                    onSubmit={handleAddSliderImage}
                    isLoading={isLoading || tagsLoading}
                    tags={tags}
                    usedTagIds={getUsedTagIds()}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
