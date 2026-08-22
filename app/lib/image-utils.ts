/**
 * Converts an image (data URL or blob URL) to a compressed WebP blob.
 *
 * @param imageSource - data: or blob: URL of the source image
 * @param maxWidth    - maximum width in pixels (height scales proportionally)
 * @param quality     - WebP quality 0–1 (default 0.82 ≈ good balance)
 */
export function convertToWebP(
  imageSource: string,
  maxWidth = 1200,
  quality = 0.82,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get 2D canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("canvas.toBlob returned null"));
          }
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for conversion"));
    img.src = imageSource;
  });
}

/**
 * Download an image to the user's device.
 *
 * Tries a CORS fetch + blob URL first (forces a real download). Falls back to
 * a plain link with Cloudinary's `fl_attachment` transform for cross-origin
 * URLs, where the `download` attribute is ignored.
 */
export async function downloadImage(imageUrl: string, fileName: string) {
  const safeName = fileName || "image.png";

  // Primary path: fetch the bytes and save them via a blob URL. Works when the
  // host (e.g. Cloudinary) allows CORS, and forces a real file download.
  try {
    const response = await fetch(imageUrl, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke only after the click has been processed — revoking synchronously
    // can abort the download before it starts in some browsers.
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return;
  } catch (error) {
    console.error("Blob download failed, falling back:", error);
  }

  // Fallback: the `download` attribute is ignored for cross-origin URLs, so a
  // plain <a> just opens the image in a new tab. For Cloudinary URLs, inject
  // `fl_attachment` so the CDN responds with Content-Disposition: attachment,
  // which forces a real download regardless of origin.
  const downloadUrl = imageUrl.includes("/upload/")
    ? imageUrl.replace("/upload/", "/upload/fl_attachment/")
    : imageUrl;
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = safeName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
