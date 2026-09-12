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

/**
 * Render a QR code for `value` into an offscreen canvas of `size` px.
 *
 * `qrcode.react` only ships React components, so this mounts QRCodeCanvas into
 * a detached root and pulls the pixels back out. Generating locally (instead of
 * hitting an external QR image service) keeps card export working offline and
 * avoids printing a card whose QR silently failed to load.
 */
export async function renderQrToCanvas(
  value: string,
  size: number,
  options: {
    fgColor?: string;
    bgColor?: string;
    level?: "L" | "M" | "Q" | "H";
  } = {},
): Promise<HTMLCanvasElement | null> {
  const [{ createRoot }, { QRCodeCanvas }, React] = await Promise.all([
    import("react-dom/client"),
    import("qrcode.react"),
    import("react"),
  ]);

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-9999px";
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(QRCodeCanvas, {
          value,
          size,
          level: options.level ?? "M",
          marginSize: 0,
          fgColor: options.fgColor,
          bgColor: options.bgColor,
        }),
      );
      // Let React commit before we read the canvas back.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const rendered = host.querySelector("canvas");
    if (!rendered) return null;

    // Copy out: the source canvas dies with the unmounted root.
    const copy = document.createElement("canvas");
    copy.width = rendered.width;
    copy.height = rendered.height;
    copy.getContext("2d")?.drawImage(rendered, 0, 0);
    return copy;
  } finally {
    root.unmount();
    host.remove();
  }
}

const GREETING_CARD_WIDTH_CM = 5.5;
const GREETING_CARD_HEIGHT_CM = 9;
const GREETING_CARD_DPI = 300;
const CM_TO_INCH = 2.54;
const CSS_PX_TO_CANVAS = GREETING_CARD_DPI / 96;
const MESSAGE_MAX_FONT_SIZE = 36;
const MESSAGE_MIN_FONT_SIZE = 10;

function cm(value: number) {
  return Math.round((value / CM_TO_INCH) * GREETING_CARD_DPI);
}

function cssPx(value: number) {
  return Math.round(value * CSS_PX_TO_CANVAS);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function hasArabicText(text: string) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

function getMessageFontFamily(text: string) {
  return hasArabicText(text)
    ? '"Aref Ruqaa", "Noto Nastaliq Urdu", "Scheherazade New", serif'
    : '"Dancing Script", "Aref Ruqaa", "Noto Nastaliq Urdu", "Scheherazade New", serif';
}

function setMessageFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
) {
  ctx.font = `700 ${fontSize}px ${getMessageFontFamily(text)}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    let current = "";

    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else if (ctx.measureText(candidate).width > maxWidth) {
        let segment = "";
        for (const character of Array.from(word)) {
          const segmentCandidate = segment + character;
          if (ctx.measureText(segmentCandidate).width > maxWidth && segment) {
            lines.push(segment);
            segment = character;
          } else {
            segment = segmentCandidate;
          }
        }
        current = segment;
      } else {
        current = candidate;
      }
    }

    if (current) lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}

function fitMessageText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
) {
  for (
    let fontSize = cssPx(MESSAGE_MAX_FONT_SIZE);
    fontSize >= cssPx(MESSAGE_MIN_FONT_SIZE);
    fontSize -= 1
  ) {
    setMessageFont(ctx, text, fontSize);
    const lineHeight = fontSize * 1.5;
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length * lineHeight <= maxHeight) {
      return { fontSize, lineHeight, lines };
    }
  }

  const fontSize = cssPx(MESSAGE_MIN_FONT_SIZE);
  setMessageFont(ctx, text, fontSize);
  const lineHeight = fontSize * 1.5;
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  return {
    fontSize,
    lineHeight,
    lines: wrapText(ctx, text, maxWidth).slice(0, maxLines),
  };
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  const blockHeight = (lines.length - 1) * lineHeight;
  let yPos = y - blockHeight / 2;
  for (const line of lines) {
    ctx.fillText(line, x, yPos);
    yPos += lineHeight;
  }
}

async function loadGreetingCardFonts() {
  if (!("fonts" in document)) return;

  await Promise.allSettled([
    document.fonts.load('700 64px "Aref Ruqaa"'),
    document.fonts.load('700 72px "Dancing Script"'),
    document.fonts.load('600 26px "Tajawal"'),
  ]);
}

export async function downloadGreetingCardAsImage(cardMessage: {
  to: string;
  from: string;
  message: string;
  link?: string;
}) {
  try {
    await loadGreetingCardFonts();

    const width = cm(GREETING_CARD_WIDTH_CM);
    const cardHeight = cm(GREETING_CARD_HEIGHT_CM);
    const qrSectionHeight = cardMessage.link ? cm(3.3) : 0;
    const height = cardHeight + qrSectionHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cardRadius = cssPx(12);
    const cardPadding = cm(0.5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
    ctx.shadowBlur = cssPx(10);
    ctx.shadowOffsetY = cssPx(4);
    ctx.fillStyle = "#ffffff";
    roundedRect(ctx, 0, 0, width, cardHeight, cardRadius);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 1;
    roundedRect(ctx, 0.5, 0.5, width - 1, cardHeight - 1, cardRadius);
    ctx.stroke();

    const textLeft = cardPadding;
    const textRight = width - cardPadding;
    const labelFontPx = cssPx(14);
    const labelLineHeight = labelFontPx * 1.2;
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#333333";
    ctx.font = `700 ${labelFontPx}px Tajawal, "Segoe UI", Tahoma, sans-serif`;
    if (cardMessage.to) {
      ctx.fillText(`To: ${cardMessage.to}`, textLeft, cardPadding + labelLineHeight / 2);
    }

    const messageTop = cardPadding + labelLineHeight + cm(0.25);
    const messageBottom = cardHeight - cardPadding - labelLineHeight - cm(0.25);
    const messageHeight = messageBottom - messageTop;
    const messageText = cardMessage.message || "Message will appear here";
    const fittedMessage = fitMessageText(
      ctx,
      messageText,
      width - cardPadding * 2,
      messageHeight,
    );
    setMessageFont(ctx, messageText, fittedMessage.fontSize);
    ctx.fillStyle = cardMessage.message ? "#333333" : "#CCCCCC";
    ctx.textAlign = "center";
    ctx.direction = hasArabicText(messageText) ? "rtl" : "ltr";
    drawCenteredLines(
      ctx,
      fittedMessage.lines,
      width / 2,
      messageTop + messageHeight / 2,
      fittedMessage.lineHeight,
    );

    ctx.font = `700 ${labelFontPx}px Tajawal, "Segoe UI", Tahoma, sans-serif`;
    ctx.fillStyle = "#333333";
    ctx.direction = "ltr";
    ctx.textAlign = "right";
    if (cardMessage.from) {
      ctx.fillText(
        `From: ${cardMessage.from}`,
        textRight,
        cardHeight - cardPadding - labelLineHeight / 2,
      );
    }

    if (cardMessage.link) {
      const qrPanelWidth = cm(2.45);
      const qrPanelHeight = cm(2.35);
      const qrPanelX = (width - qrPanelWidth) / 2;
      const qrPanelY = cardHeight + cm(0.5);
      const qrPanelRadius = cm(0.08);
      const qrSize = cssPx(70);
      const qrX = (width - qrSize) / 2;
      const qrY = qrPanelY + cm(0.35);

      ctx.fillStyle = "#ffffff";
      roundedRect(ctx, qrPanelX, qrPanelY, qrPanelWidth, qrPanelHeight, qrPanelRadius);
      ctx.fill();
      ctx.strokeStyle = "#eeebe6";
      ctx.lineWidth = Math.max(1, cm(0.01));
      ctx.stroke();

      const qrCanvas = await renderQrToCanvas(cardMessage.link, qrSize, {
        fgColor: "#7d8992",
        bgColor: "#ffffff",
        level: "H",
      });

      if (qrCanvas) {
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      }

      ctx.font = `400 ${cssPx(10)}px Tajawal, "Segoe UI", Tahoma, sans-serif`;
      ctx.fillStyle = "#9ca3af";
      ctx.textAlign = "center";
      ctx.direction = "ltr";
      ctx.fillText(
        "Scan to play video/audio",
        width / 2,
        qrPanelY + qrPanelHeight - cm(0.32),
      );
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `greeting-card-${GREETING_CARD_WIDTH_CM}x${GREETING_CARD_HEIGHT_CM}cm-${(
        cardMessage.from || "card"
      ).replace(/\s/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  } catch (error) {
    console.error("Error downloading card:", error);
  }
}
