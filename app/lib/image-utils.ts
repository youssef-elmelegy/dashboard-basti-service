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
