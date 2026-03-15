import { useState } from 'react';
import { Button } from '../ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

// GeoCities-style pixel emote definitions
// Using emoji as fallback, would use GIF URLs in production
export const PIXEL_EMOTES: Record<string, { emoji: string; label: string }> = {
  ':banana:': { emoji: '🍌', label: 'Banan' },
  ':fire:': { emoji: '🔥', label: 'Eld' },
  ':love:': { emoji: '💕', label: 'Kärlek' },
  ':star:': { emoji: '⭐', label: 'Stjärna' },
  ':cool:': { emoji: '😎', label: 'Cool' },
  ':dance:': { emoji: '💃', label: 'Dans' },
  ':music:': { emoji: '🎵', label: 'Musik' },
  ':heart:': { emoji: '❤️', label: 'Hjärta' },
  ':skull:': { emoji: '💀', label: 'Skalle' },
  ':rainbow:': { emoji: '🌈', label: 'Regnbåge' },
  ':pizza:': { emoji: '🍕', label: 'Pizza' },
  ':rocket:': { emoji: '🚀', label: 'Raket' },
  ':sun:': { emoji: '☀️', label: 'Sol' },
  ':moon:': { emoji: '🌙', label: 'Måne' },
  ':cat:': { emoji: '🐱', label: 'Katt' },
  ':dog:': { emoji: '🐶', label: 'Hund' },
  ':party:': { emoji: '🎉', label: 'Fest' },
  ':ghost:': { emoji: '👻', label: 'Spöke' },
  ':lol:': { emoji: '😂', label: 'LOL' },
  ':sad:': { emoji: '😢', label: 'Ledsen' },
  ':angry:': { emoji: '😠', label: 'Arg' },
  ':wink:': { emoji: '😉', label: 'Blink' },
  ':kiss:': { emoji: '😘', label: 'Kyss' },
  ':thinking:': { emoji: '🤔', label: 'Tänker' },
};

/**
 * Replace emote codes in text with styled pixel emotes
 */
export function replaceEmoteCodes(text: string): React.ReactNode {
  const emotePattern = /:([\w]+):/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = emotePattern.exec(text)) !== null) {
    // Add text before the emote
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const code = match[0];
    const emote = PIXEL_EMOTES[code];
    
    if (emote) {
      parts.push(
        <span
          key={`${match.index}-${code}`}
          className="inline-flex items-center justify-center w-6 h-6 text-lg align-middle animate-bounce"
          title={emote.label}
          style={{ animationDuration: '1s', animationIterationCount: 'infinite' }}
        >
          {emote.emoji}
        </span>
      );
    } else {
      // Unknown emote, keep as text
      parts.push(code);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

interface EmotePickerProps {
  onSelect: (code: string) => void;
  className?: string;
}

/**
 * Picker panel for selecting pixel emotes
 */
export function EmotePicker({ onSelect, className }: EmotePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const emoteEntries = Object.entries(PIXEL_EMOTES);

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="shrink-0 text-muted-foreground hover:text-primary"
        title="Välj emote"
      >
        <Smile className="w-5 h-5" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Picker panel */}
          <div className="absolute bottom-full left-0 mb-2 z-50 bg-card border border-border rounded-lg shadow-xl p-3 w-64 max-h-48 overflow-y-auto scrollbar-nostalgic animate-scale-in">
            <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              Pixel Emotes
            </div>
            <div className="grid grid-cols-6 gap-1">
              {emoteEntries.map(([code, emote]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onSelect(code);
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-primary/20 rounded transition-colors hover:scale-110"
                  title={`${emote.label} (${code})`}
                >
                  {emote.emoji}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              Skriv t.ex. :fire: i texten
            </div>
          </div>
        </>
      )}
    </div>
  );
}
