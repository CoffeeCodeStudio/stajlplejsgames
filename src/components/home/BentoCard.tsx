/**
 * @module BentoCard
 * Glassmorphism bento card wrapper for the 2026 dashboard.
 * Supports header, icon, and micro-interaction "pressable" feel.
 */
import type { ReactNode } from "react";

interface BentoCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  span?: "default" | "wide" | "tall";
}

const spanClasses = {
  default: "",
  wide: "sm:col-span-2",
  tall: "sm:row-span-2",
};

export function BentoCard({ title, icon, children, className = "", span = "default" }: BentoCardProps) {
  return (
    <div className={`glass-card flex flex-col ${spanClasses[span]} ${className}`}>
      {/* Header strip */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-2.5 border-b border-[hsl(var(--glass-border))]">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="font-display font-bold text-sm text-foreground tracking-wide">{title}</h3>
      </div>
      {/* Content */}
      <div className="relative z-10 p-4 flex-1">{children}</div>
    </div>
  );
}
