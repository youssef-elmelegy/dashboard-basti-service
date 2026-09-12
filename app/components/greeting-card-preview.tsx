import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";

interface GreetingCardPreviewProps {
  cardMessage: {
    to: string;
    from: string;
    message: string;
    link?: string;
  };
}

const MESSAGE_MAX_FONT_SIZE = 36;
const MESSAGE_MIN_FONT_SIZE = 10;

function hasArabicText(text: string) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

export function GreetingCardPreview({ cardMessage }: GreetingCardPreviewProps) {
  const messageRef = useRef<HTMLParagraphElement>(null);
  const [messageFontSize, setMessageFontSize] = useState(
    MESSAGE_MAX_FONT_SIZE,
  );
  const isArabicMessage = useMemo(
    () => hasArabicText(cardMessage.message),
    [cardMessage.message],
  );

  useLayoutEffect(() => {
    const element = messageRef.current;
    if (!element) return;

    let frame = 0;
    const fitMessage = () => {
      let nextSize = MESSAGE_MAX_FONT_SIZE;
      element.style.fontSize = `${nextSize}px`;

      while (
        nextSize > MESSAGE_MIN_FONT_SIZE &&
        (element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth)
      ) {
        nextSize -= 1;
        element.style.fontSize = `${nextSize}px`;
      }

      setMessageFontSize(nextSize);
    };

    frame = requestAnimationFrame(fitMessage);
    document.fonts?.ready.then(fitMessage).catch(() => {});

    const resizeObserver = new ResizeObserver(fitMessage);
    resizeObserver.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [cardMessage.message, isArabicMessage]);

  return (
    <div className="mx-auto flex w-full max-w-[5.5cm] flex-col items-center gap-6">
      <div className="flex h-[9cm] w-[5.5cm] max-w-full shrink-0 flex-col justify-between overflow-hidden rounded-[12px] border border-[#E0E0E0] bg-white p-[0.5cm] text-[#333333] shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
        <p className="text-left font-['Tajawal','Segoe_UI',Tahoma,sans-serif] text-[14px] font-bold leading-none text-[#333333]">
          To: <span dir="auto">{cardMessage.to}</span>
        </p>

        <div className="flex min-h-0 flex-1 items-center justify-center py-3">
          <p
            ref={messageRef}
            dir="auto"
            className={`max-h-full w-full overflow-hidden break-words whitespace-pre-wrap text-center font-bold leading-[1.5] text-[#333333] ${
              isArabicMessage
                ? "font-['Aref_Ruqaa','Noto_Nastaliq_Urdu','Scheherazade_New',serif]"
                : "font-['Dancing_Script','Aref_Ruqaa','Noto_Nastaliq_Urdu','Scheherazade_New',serif]"
            }`}
            style={{
              color: cardMessage.message ? "#333333" : "#CCCCCC",
              fontSize: messageFontSize,
            }}
          >
            {cardMessage.message || "Message will appear here"}
          </p>
        </div>

        <p className="text-right font-['Tajawal','Segoe_UI',Tahoma,sans-serif] text-[14px] font-bold leading-none text-[#333333]">
          From: <span dir="auto">{cardMessage.from}</span>
        </p>
      </div>

      {cardMessage.link && (
        <div className="flex flex-col items-center rounded-lg border border-[#E0E0E0] bg-white px-4 py-5">
          <QRCode
            value={cardMessage.link || ""}
            size={70}
            level="H"
            includeMargin={false}
            fgColor="#7d8992"
            bgColor="#ffffff"
          />
          <p className="mt-4 whitespace-nowrap font-['Tajawal','Segoe_UI',Tahoma,sans-serif] text-[10px] text-[#9ca3af]">
            Scan to play video/audio
          </p>
        </div>
      )}
    </div>
  );
}
