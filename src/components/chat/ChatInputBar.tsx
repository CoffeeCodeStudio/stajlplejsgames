/** Emoticon bar + font toolbar + text input + send button — MSN XP style */
import { useState } from "react";
import { Smile, Image, Gift, Bold, Italic, Underline, Palette, Bell, Type } from "lucide-react";
import { Button } from "../ui/button";
import { MsnEmoticonPicker, quickEmoticons } from "./MsnEmoticons";

interface ChatInputBarProps {
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onNudge?: () => void;
}

export function ChatInputBar({ inputMessage, onInputChange, onSend, onFocus, onBlur, onNudge }: ChatInputBarProps) {
  const [showEmojis, setShowEmojis] = useState(false);

  const addEmoji = (emoji: string) => {
    onInputChange(inputMessage + emoji);
    setShowEmojis(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <>
      {/* MSN Font Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-gradient-to-b from-[#f6f6f6] to-[#ebebeb] dark:from-gray-800 dark:to-gray-750 border-t border-gray-300 dark:border-gray-600">
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Typsnitt">
          <Type className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Fetstil">
          <Bold className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Kursiv">
          <Italic className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Understruken">
          <Underline className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Textfärg">
          <Palette className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        <div className="relative">
          <button
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={() => setShowEmojis(!showEmojis)}
            title="Emoticons"
          >
            <Smile className="w-3.5 h-3.5 text-yellow-600" />
          </button>
          {showEmojis && (
            <div className="absolute bottom-full left-0 mb-1 z-50">
              <MsnEmoticonPicker onSelect={addEmoji} />
            </div>
          )}
        </div>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Bild">
          <Image className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Wink">
          <Gift className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
        {onNudge && (
          <button
            className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors"
            onClick={onNudge}
            title="Nudge"
          >
            <Bell className="w-3.5 h-3.5 text-orange-500" />
          </button>
        )}
        <div className="flex-1" />
        <div className="flex gap-0.5 overflow-x-auto">
          {quickEmoticons.slice(0, 6).map((item) => (
            <button
              key={item.code}
              onClick={() => addEmoji(item.emoji)}
              title={item.code}
              className="text-sm hover:scale-125 transition-transform px-0.5 hover:bg-white/50 rounded flex-shrink-0"
            >
              {item.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Divider line */}
      <div className="h-px bg-gray-400 dark:bg-gray-500" />

      {/* Text Input */}
      <div className="bg-white dark:bg-gray-900 p-2">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Skriv ett meddelande..."
            rows={2}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded-sm px-2 py-1.5 text-[13px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:border-[#316ac5] font-mono"
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={onSend}
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-b from-[hsl(220,70%,55%)] to-[hsl(220,70%,45%)] hover:from-[hsl(220,70%,60%)] hover:to-[hsl(220,70%,50%)] text-white text-xs px-4"
            >
              Skicka
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
