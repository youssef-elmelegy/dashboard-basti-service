/**
 * Shared upload handling for the bakery logo and gallery.
 *
 * The Add and Edit bakery forms both let an admin pick a logo and up to
 * `BAKERY_GALLERY_MAX_IMAGES` gallery images. The uploader components hand back
 * base64 data URLs, but the API stores Cloudinary URLs, so each newly picked
 * image has to be converted to WebP and uploaded before the form is submitted.
 *
 * Images that are already `http(s)` URLs — the ones an edited bakery loaded
 * with — are passed through untouched so re-saving a form never re-uploads what
 * is already stored.
 */

import { useState } from "react";
import { convertToWebP } from "@/lib/image-utils";
import { uploadImage } from "@/lib/api/cake.api";
import { UPLOAD_FOLDERS } from "@/lib/upload-folders";

/** True for values already hosted remotely, which need no upload. */
function isRemoteUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

/**
 * Converts a freshly picked data URL to WebP and uploads it, returning the
 * stored URL. Remote URLs are returned as-is.
 */
async function uploadIfNeeded(image: string, fileName: string): Promise<string> {
  if (isRemoteUrl(image)) return image;

  const webpBlob = await convertToWebP(image);
  const file = new File([webpBlob], fileName, { type: "image/webp" });

  const response = await uploadImage(file, UPLOAD_FOLDERS.bakeries);
  if (!response.success || !response.data) {
    throw new Error(response.message || "Image upload failed");
  }
  return response.data.secure_url;
}

export interface BakeryMedia {
  /** Logo as shown in the form — data URL while pending, remote URL once saved. */
  logo: string | undefined;
  setLogo: (logo: string | undefined) => void;
  /** Gallery as shown in the form, mixing pending data URLs and remote URLs. */
  gallery: string[];
  setGallery: (gallery: string[]) => void;
  /** True while any upload is in flight — used to disable submit. */
  isUploading: boolean;
  /** Set when the last resolve attempt failed, so the form can surface it. */
  uploadError: string | null;
  /**
   * Uploads whatever is still pending and returns the stored URLs. Call this
   * from the form's submit handler and send the result to the API.
   */
  resolveMedia: () => Promise<{
    logoUrl: string | undefined;
    galleryImages: string[];
  }>;
}

export function useBakeryMedia(
  initialLogo?: string | null,
  initialGallery?: string[],
): BakeryMedia {
  const [logo, setLogo] = useState<string | undefined>(initialLogo ?? undefined);
  const [gallery, setGallery] = useState<string[]>(initialGallery ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const resolveMedia = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const logoUrl = logo ? await uploadIfNeeded(logo, "bakery-logo.webp") : undefined;

      // Sequential rather than parallel to match how the other forms in this
      // dashboard upload image sets, and to keep gallery order stable.
      const galleryImages: string[] = [];
      for (const [index, image] of gallery.entries()) {
        galleryImages.push(await uploadIfNeeded(image, `bakery-gallery-${index + 1}.webp`));
      }

      return { logoUrl, galleryImages };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload bakery images";
      setUploadError(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    logo,
    setLogo,
    gallery,
    setGallery,
    isUploading,
    uploadError,
    resolveMedia,
  };
}
