import { useState } from "react";
import { cn } from "@/lib/utils";

// Classic MSN-style emoticons mapped to emoji with optional animated GIF URLs
export const msnEmoticons: Record<string, { emoji: string; alt: string; gif?: string }> = {
  ":)": { emoji: "😊", alt: "Leende", gif: "https://emojis.slackmojis.com/emojis/images/1643514715/7862/smiley.gif" },
  ":D": { emoji: "😃", alt: "Stort leende", gif: "https://emojis.slackmojis.com/emojis/images/1643514648/7340/bigsmile.gif" },
  ";)": { emoji: "😉", alt: "Blinkning", gif: "https://emojis.slackmojis.com/emojis/images/1643514692/7724/wink.gif" },
  ":(": { emoji: "😞", alt: "Ledsen", gif: "https://emojis.slackmojis.com/emojis/images/1643514711/7845/sad.gif" },
  ":O": { emoji: "😮", alt: "Förvånad" },
  ":P": { emoji: "😛", alt: "Tungan ute", gif: "https://emojis.slackmojis.com/emojis/images/1643514693/7726/tongue.gif" },
  ":S": { emoji: "😕", alt: "Förvirrad" },
  ":'(": { emoji: "😢", alt: "Gråter" },
  ":@": { emoji: "😠", alt: "Arg" },
  "8)": { emoji: "😎", alt: "Cool" },
  ":|": { emoji: "😐", alt: "Neutral" },
  ":$": { emoji: "😳", alt: "Generad" },
  "(H)": { emoji: "😎", alt: "Cool" },
  "(A)": { emoji: "😇", alt: "Ängel" },
  "(L)": { emoji: "❤️", alt: "Hjärta" },
  "(U)": { emoji: "💔", alt: "Krossat hjärta" },
  "(K)": { emoji: "💋", alt: "Kyss" },
  "(G)": { emoji: "🎁", alt: "Present" },
  "(F)": { emoji: "🌹", alt: "Ros" },
  "(W)": { emoji: "🥀", alt: "Vissnad ros" },
  "(P)": { emoji: "📷", alt: "Kamera" },
  "(~)": { emoji: "🎬", alt: "Film" },
  "(T)": { emoji: "📞", alt: "Telefon" },
  "(@)": { emoji: "🐱", alt: "Katt" },
  "(&)": { emoji: "🐶", alt: "Hund" },
  "(I)": { emoji: "💡", alt: "Lampa" },
  "(C)": { emoji: "☕", alt: "Kaffe" },
  "(S)": { emoji: "🌙", alt: "Måne" },
  "(*) ": { emoji: "⭐", alt: "Stjärna" },
  "(#)": { emoji: "☀️", alt: "Sol" },
  "(R)": { emoji: "🌈", alt: "Regnbåge" },
  "(O)": { emoji: "⏰", alt: "Klocka" },
  "(E)": { emoji: "📧", alt: "E-post" },
  "(^)": { emoji: "🎂", alt: "Tårta" },
  "(B)": { emoji: "🍺", alt: "Öl" },
  "(D)": { emoji: "🍸", alt: "Drink" },
  "(Z)": { emoji: "👦", alt: "Pojke" },
  "(X)": { emoji: "👧", alt: "Flicka" },
  "(Y)": { emoji: "👍", alt: "Tummen upp" },
  "(N)": { emoji: "👎", alt: "Tummen ner" },
};

// Quick-access MSN emoticon buttons
export const quickEmoticons = [
  { code: ":)", emoji: "😊" },
  { code: ":D", emoji: "😃" },
  { code: ";)", emoji: "😉" },
  { code: ":(", emoji: "😞" },
  { code: ":P", emoji: "😛" },
  { code: ":O", emoji: "😮" },
  { code: "(L)", emoji: "❤️" },
  { code: "(Y)", emoji: "👍" },
  { code: "(K)", emoji: "💋" },
  { code: "8)", emoji: "😎" },
  { code: ":@", emoji: "😠" },
  { code: ":'(", emoji: "😢" },
  { code: "(H)", emoji: "😎" },
  { code: "(A)", emoji: "😇" },
  { code: "(F)", emoji: "🌹" },
  { code: "(C)", emoji: "☕" },
];

// Convert text with MSN emoticon codes to React nodes with animated GIFs where available
export function convertMsnEmoticons(text: string): React.ReactNode {
  // Build sorted codes (longest first to avoid partial matches)
  const codes = Object.keys(msnEmoticons).sort((a, b) => b.length - a.length);
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    let matched = false;
    for (const code of codes) {
      if (remaining.startsWith(code)) {
        const emote = msnEmoticons[code];
        if (emote.gif) {
          parts.push(
            <img
              key={keyIdx++}
              src={emote.gif}
              alt={emote.alt}
              title={`${code} ${emote.alt}`}
              className="inline-block align-middle"
              style={{ height: '22px', width: 'auto' }}
              loading="lazy"
            />
          );
        } else {
          parts.push(
            <span key={keyIdx++} title={`${code} ${emote.alt}`} className="inline align-middle">
              {emote.emoji}
            </span>
          );
        }
        remaining = remaining.slice(code.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Accumulate plain text
      const lastPart = parts[parts.length - 1];
      if (typeof lastPart === 'string') {
        parts[parts.length - 1] = lastPart + remaining[0];
      } else {
        parts.push(remaining[0]);
      }
      remaining = remaining.slice(1);
    }
  }

  // Merge adjacent strings
  const merged: React.ReactNode[] = [];
  for (const part of parts) {
    if (typeof part === 'string' && typeof merged[merged.length - 1] === 'string') {
      merged[merged.length - 1] = (merged[merged.length - 1] as string) + part;
    } else {
      merged.push(part);
    }
  }

  return merged.length === 1 && typeof merged[0] === 'string' ? merged[0] : <>{merged}</>;
}

interface MsnEmoticonPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function MsnEmoticonPicker({ onSelect, className }: MsnEmoticonPickerProps) {
  const [showAll, setShowAll] = useState(false);
  
  const emoticonsToShow = showAll ? Object.entries(msnEmoticons) : quickEmoticons.map(e => [e.code, { emoji: e.emoji, alt: "" }] as const);
  
  return (
    <div className={cn("bg-card border border-border rounded-lg p-2 shadow-lg", className)}>
      <div className="text-[10px] text-muted-foreground mb-2 font-bold uppercase">
        MSN Emoticons
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
        {emoticonsToShow.map(([code, data]) => (
          <button
            key={code}
            onClick={() => onSelect(typeof data === 'object' ? data.emoji : data)}
            title={`${code}`}
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
          >
            {typeof data === 'object' ? data.emoji : data}
          </button>
        ))}
      </div>
      <button
        onClick={() => setShowAll(!showAll)}
        className="w-full text-[10px] text-primary hover:underline mt-2"
      >
        {showAll ? "Visa färre" : "Visa alla emoticons"}
      </button>
    </div>
  );
}
