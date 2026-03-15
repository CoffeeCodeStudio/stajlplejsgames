import { useState, useEffect } from 'react';
import { useLajv } from '@/contexts/LajvContext';
import { Avatar } from './Avatar';
import { Radio } from 'lucide-react';
import { replaceEmoteCodes } from './social/PixelEmotes';

export function GlobalLajvTicker() {
  const { messages } = useLajv();
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);

  // Rotate through messages every 5 seconds
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentDisplayIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Reset index if it's out of bounds
  useEffect(() => {
    if (currentDisplayIndex >= messages.length && messages.length > 0) {
      setCurrentDisplayIndex(0);
    }
  }, [messages.length, currentDisplayIndex]);

  const currentMessage = messages[currentDisplayIndex];

  return (
    <div className="lajv-ticker-row">
      {/* Radio icon */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <Radio className="w-4 h-4 text-primary" />
          {messages.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <span className="font-bold text-xs text-primary uppercase tracking-wide">LAJV</span>
      </div>

      {/* Message display area */}
      <div className="flex-1 min-w-0">
        {messages.length === 0 ? (
          <span className="text-sm text-muted-foreground italic">
            Just nu finns inga aktiva lajvsändningar
          </span>
        ) : currentMessage ? (
          <div className="flex items-center gap-3 text-sm animate-fade-in">
            <Avatar
              name={currentMessage.username}
              src={currentMessage.avatar_url || undefined}
              size="sm"
              className="w-6 h-6 shrink-0"
            />
            <span className="font-semibold text-foreground shrink-0 max-w-[100px] truncate">
              {currentMessage.username}:
            </span>
            <span className="text-foreground truncate flex-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
              {replaceEmoteCodes(currentMessage.message)}
            </span>
            {messages.length > 1 && (
              <span className="text-xs text-muted-foreground shrink-0">
                ({currentDisplayIndex + 1}/{messages.length})
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* No input here — users post from the Lajv tab */}
    </div>
  );
}
