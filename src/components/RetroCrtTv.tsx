/**
 * @module RetroCrtTv
 * Renders an animated retro CRT television with a typing text effect,
 * scanlines, and glitch animations. Clickable for unauthenticated visitors,
 * navigating them to the registration page.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const MESSAGES = [
  "Välkommen till Echo 2000",
  "En algoritm-fri zon",
  "Där nostalgin hittar hem",
  "Inga likes, bara vibes",
  "MSN-ljud aktiverade",
  "Logga in, häng med oss",
  "Retro är det nya svarta",
  "A/S/L?",
];

const TYPING_SPEED = 70;
const PAUSE_AFTER = 2200;
const ERASE_SPEED = 30;

export function RetroCrtTv() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");
  const charIdx = useRef(0);

  useEffect(() => {
    const msg = MESSAGES[msgIdx];

    if (phase === "typing") {
      if (charIdx.current <= msg.length) {
        const t = setTimeout(() => {
          setText(msg.slice(0, charIdx.current));
          charIdx.current++;
        }, TYPING_SPEED);
        return () => clearTimeout(t);
      } else {
        setPhase("pause");
      }
    }

    if (phase === "pause") {
      const t = setTimeout(() => setPhase("erasing"), PAUSE_AFTER);
      return () => clearTimeout(t);
    }

    if (phase === "erasing") {
      if (charIdx.current > 0) {
        const t = setTimeout(() => {
          charIdx.current--;
          setText(msg.slice(0, charIdx.current));
        }, ERASE_SPEED);
        return () => clearTimeout(t);
      } else {
        setMsgIdx((i) => (i + 1) % MESSAGES.length);
        setPhase("typing");
      }
    }
  }, [phase, text, msgIdx]);

  const handleClick = () => {
    if (!user) navigate("/auth");
  };

  return (
    <div
      className={`retro-crt-tv mx-auto${!user ? " cursor-pointer" : ""}`}
      aria-label="Retro CRT TV"
      onClick={handleClick}
      role={!user ? "link" : undefined}
      tabIndex={!user ? 0 : undefined}
      onKeyDown={!user ? (e) => { if (e.key === "Enter") handleClick(); } : undefined}
    >
      {/* Outer shell */}
      <div className="crt-body">
        {/* Screen bezel */}
        <div className="crt-bezel">
          {/* Screen */}
          <div className="crt-screen">
            {/* Scanline overlay */}
            <div className="crt-scanlines" aria-hidden="true" />
            {/* Glitch bar */}
            <div className="crt-glitch" aria-hidden="true" />
            {/* Text */}
            <span className="crt-text">
              {text}
              <span className="crt-cursor" aria-hidden="true">█</span>
            </span>
          </div>
        </div>

        {/* TV controls */}
        <div className="crt-controls">
          <div className="crt-knob" />
          <div className="crt-knob crt-knob--small" />
          <div className="crt-led" />
        </div>
      </div>

      {/* Stand */}
      <div className="crt-stand">
        <div className="crt-stand-neck" />
        <div className="crt-stand-base" />
      </div>
    </div>
  );
}
