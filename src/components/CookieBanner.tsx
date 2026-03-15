import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const COOKIE_KEY = "echo2000_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-lg p-4 shadow-lg flex items-center gap-3">
        <Cookie className="w-5 h-5 text-accent shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">
          Echo2000 använder cookies för att förbättra din upplevelse.
        </p>
        <Button size="sm" onClick={accept}>
          Godkänn
        </Button>
      </div>
    </div>
  );
}
