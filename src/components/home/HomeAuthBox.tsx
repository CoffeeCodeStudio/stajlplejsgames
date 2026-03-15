import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
import { AuthDialog } from "../auth/AuthDialog";

export function HomeAuthBox() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  if (user) return null;

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
          <h3 className="font-display font-bold text-sm text-primary">🔑 Logga in / Registrera</h3>
        </div>
        <div className="p-3 bg-card space-y-2">
          <p className="text-xs text-muted-foreground">Gå med i communityn och börja chatta!</p>
          <div className="flex gap-2">
            <Button size="sm" variant="msn" className="flex-1 text-xs" onClick={() => navigate("/auth")}>
              Logga in
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => navigate("/auth")}>
              Registrera
            </Button>
          </div>
        </div>
      </div>
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}
