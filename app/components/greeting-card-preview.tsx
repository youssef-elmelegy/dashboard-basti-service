import { useTranslation } from "react-i18next";
import { QRCodeSVG as QRCode } from "qrcode.react";

interface GreetingCardPreviewProps {
  cardMessage: {
    to: string;
    from: string;
    message: string;
    link?: string;
  };
}

export function GreetingCardPreview({ cardMessage }: GreetingCardPreviewProps) {
  const { i18n } = useTranslation();

  return (
    <div className="relative bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-8 border-2 border-amber-200 shadow-lg min-h-96 flex flex-col overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />

      {/* Top - To field */}
      <div className="relative z-10">
        <p className="text-sm text-amber-700/70 font-medium">
          To: <span className="font-semibold">{cardMessage.to}</span>
        </p>
      </div>

      {/* Middle - Centered Message with QR Code */}
      <div className="relative z-10 flex-1 flex items-center justify-center gap-6">
        <p className="text-2xl font-serif italic text-amber-900 leading-relaxed text-center flex-1">
          {cardMessage.message}
        </p>
        {cardMessage.link && (
          <div className="bg-white p-2 rounded border border-amber-200 shrink-0">
            <QRCode
              value={cardMessage.link || ""}
              size={80}
              level="H"
              includeMargin={false}
            />
          </div>
        )}
      </div>

      {/* Bottom - Signature */}
      <div className="relative z-10 flex items-end justify-end">
        <div
          className={`${i18n.language === "ar" ? "text-left" : "text-right"}`}
        >
          <p className="text-sm text-amber-700/70">With warm wishes,</p>
          <p className="text-lg font-serif text-amber-900">
            {cardMessage.from}
          </p>
        </div>
      </div>
    </div>
  );
}
