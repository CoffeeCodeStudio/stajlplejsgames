/**
 * @module CrtBackground
 * Full-width CRT TV frame used as a background wrapper.
 * Content is rendered inside the "screen" area with
 * scanline overlay, phosphor glow, and vignette effects.
 */
import type { ReactNode } from "react";
import "./crt-background.css";

interface CrtBackgroundProps {
  children: ReactNode;
}

export function CrtBackground({ children }: CrtBackgroundProps) {
  return (
    <div className="crt-bg-wrapper">
      {/* TV Body / outer frame */}
      <div className="crt-bg-body">
        {/* Bezel */}
        <div className="crt-bg-bezel">
          {/* Screen area — content goes here */}
          <div className="crt-bg-screen">
            {/* Scanline overlay */}
            <div className="crt-bg-scanlines" aria-hidden="true" />
            {/* Phosphor glow on inner edges */}
            <div className="crt-bg-glow" aria-hidden="true" />
            {/* Corner vignette */}
            <div className="crt-bg-vignette" aria-hidden="true" />
            {/* Content */}
            <div className="crt-bg-content">{children}</div>
          </div>
        </div>

        {/* TV controls row */}
        <div className="crt-bg-controls">
          <div className="crt-bg-knob" />
          <div className="crt-bg-knob crt-bg-knob--sm" />
          <div className="crt-bg-led" />
        </div>
      </div>

      {/* Stand */}
      <div className="crt-bg-stand">
        <div className="crt-bg-stand-neck" />
        <div className="crt-bg-stand-base" />
      </div>
    </div>
  );
}
