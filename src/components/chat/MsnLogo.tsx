import { cn } from "@/lib/utils";

interface MsnLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animated?: boolean;
}

export function MsnLogo({ size = "md", className, animated = false }: MsnLogoProps) {
  const sizes = {
    sm: { container: "w-8 h-8", wing: "w-2 h-3", body: "w-1 h-2" },
    md: { container: "w-12 h-12", wing: "w-3 h-4", body: "w-1.5 h-3" },
    lg: { container: "w-16 h-16", wing: "w-4 h-5", body: "w-2 h-4" },
  };

  const s = sizes[size];

  return (
    <div className={cn("relative", s.container, className)}>
      {/* MSN Butterfly Wings */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        animated && "animate-pulse-soft"
      )}>
        {/* Top-left wing - Orange */}
        <div className={cn(
          s.wing,
          "absolute bg-gradient-to-br from-orange-400 to-orange-500 rounded-full transform -rotate-45",
          "top-1 left-1"
        )} />
        {/* Top-right wing - Green */}
        <div className={cn(
          s.wing,
          "absolute bg-gradient-to-br from-green-400 to-green-500 rounded-full transform rotate-45",
          "top-1 right-1"
        )} />
        {/* Bottom-left wing - Red */}
        <div className={cn(
          s.wing,
          "absolute bg-gradient-to-br from-red-400 to-red-500 rounded-full transform rotate-45",
          "bottom-1 left-1"
        )} />
        {/* Bottom-right wing - Blue */}
        <div className={cn(
          s.wing,
          "absolute bg-gradient-to-br from-blue-400 to-blue-500 rounded-full transform -rotate-45",
          "bottom-1 right-1"
        )} />
        {/* Body */}
        <div className={cn(
          s.body,
          "absolute bg-gradient-to-b from-gray-700 to-gray-800 rounded-full",
          "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )} />
      </div>
    </div>
  );
}

export function MsnLogoWithText({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MsnLogo size="md" animated />
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-tight text-white">
          Echo<span className="text-green-400">Messenger</span>
        </span>
        <span className="text-[9px] text-white/60 leading-tight">
          .NET Messenger Service
        </span>
      </div>
    </div>
  );
}
