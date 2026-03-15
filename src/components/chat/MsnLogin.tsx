import { useState } from "react";
import { MessageCircle, Volume2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "@/lib/utils";
import { useMsnSounds } from "@/hooks/useMsnSounds";

interface MsnLoginProps {
  onLogin: (displayName: string, status: string) => void;
}

const statusOptions = [
  { value: "online", label: "Online", color: "bg-[hsl(var(--online-green))]" },
  { value: "away", label: "Borta", color: "bg-[hsl(var(--away-orange))]" },
  { value: "busy", label: "Upptagen", color: "bg-[hsl(var(--busy-red))]" },
  { value: "invisible", label: "Visa som offline", color: "bg-[hsl(var(--offline-gray))]" },
];

export function MsnLogin({ onLogin }: MsnLoginProps) {
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("online");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { playSound } = useMsnSounds();

  const handleLogin = async () => {
    if (!displayName.trim()) return;
    
    setIsLoading(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Play online sound
    playSound("online");
    
    setIsLoading(false);
    onLogin(displayName, status);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[hsl(220,70%,50%)] via-[hsl(210,70%,55%)] to-[hsl(200,70%,60%)] p-4">
      <div className="w-full max-w-md">
        {/* MSN Messenger Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="relative">
              {/* MSN Butterfly-inspired logo */}
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-8 bg-orange-400 rounded-full transform -rotate-45 translate-x-1"></div>
                  <div className="w-6 h-8 bg-green-400 rounded-full transform rotate-45 -translate-x-1"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-8 bg-blue-400 rounded-full transform rotate-45 translate-x-1 translate-y-2"></div>
                  <div className="w-6 h-8 bg-red-400 rounded-full transform -rotate-45 -translate-x-1 translate-y-2"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-4 bg-white/80 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <h1 className="font-display font-bold text-2xl text-white drop-shadow-lg">
            Echo Messenger
          </h1>
          <p className="text-white/80 text-sm">
            .NET Messenger Service
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] rounded-lg shadow-2xl overflow-hidden border border-white/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-[hsl(220,70%,45%)] to-[hsl(200,70%,50%)] px-4 py-2">
            <div className="flex items-center gap-2 text-white">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Logga in</span>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Visningsnamn:
              </label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="~*Ditt namn*~"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Tips: Använd ~*symboler*~ för att sticka ut!
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status:
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        statusOptions.find(s => s.value === status)?.color
                      )} />
                      {statusOptions.find(s => s.value === status)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", opt.color)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="remember" className="text-xs text-gray-600">
                Kom ihåg mig på den här datorn
              </label>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={!displayName.trim() || isLoading}
              className="w-full bg-gradient-to-b from-[hsl(220,70%,55%)] to-[hsl(220,70%,45%)] hover:from-[hsl(220,70%,60%)] hover:to-[hsl(220,70%,50%)] text-white font-medium py-2 shadow-md"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ansluter...
                </div>
              ) : (
                "Logga in"
              )}
            </Button>

            {/* Connecting animation */}
            {isLoading && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <p className="text-xs text-gray-500">Ansluter till .NET Messenger Service...</p>
              </div>
            )}
          </div>

          {/* Footer Links */}
          <div className="bg-gray-100 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between text-[10px] text-blue-600">
              <button className="hover:underline">Glömt lösenord?</button>
              <button className="hover:underline">Skapa nytt konto</button>
            </div>
          </div>
        </div>

        {/* Sound indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 text-white/60 text-xs">
          <Volume2 className="w-3 h-3" />
          <span>Ljud aktiverat</span>
        </div>
      </div>
    </div>
  );
}
