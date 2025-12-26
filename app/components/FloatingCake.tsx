import cakeLoginImg from "@/assets/cake_login.png";

interface FloatingCakeProps {
  rotation?: number;
  shadowWidth?: number;
  shadowHeight?: number;
  shadowOpacity?: number;
  shadowBlur?: number;
  imageClassName?: string;
}

export function FloatingCake({
  rotation = 5,
  shadowWidth = 390,
  shadowHeight = 70,
  shadowOpacity = 0.3,
  shadowBlur = 30,
  imageClassName = "max-w-2xl",
}: FloatingCakeProps) {
  return (
    <div className="relative flex items-center justify-center">
      <img
        src={cakeLoginImg}
        alt="Cake"
        className={`${imageClassName} drop-shadow-2xl relative z-10`}
        style={{ transform: `rotate(${rotation}deg)` }}
      />
      {/* Floating shadow */}
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 rounded-full opacity-50"
        style={{
          width: `${shadowWidth}px`,
          height: `${shadowHeight}px`,
          backgroundColor: `rgba(0, 0, 0, ${shadowOpacity})`,
          filter: `blur(${shadowBlur}px)`,
          zIndex: 0,
        }}
      />
    </div>
  );
}
