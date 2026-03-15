import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { MeetupsSection } from "./MeetupsSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function LockedMeetups() {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) { setChecking(false); return; }
      try {
        const [adminRes, modRes] = await Promise.all([
          supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
          supabase.rpc('has_role', { _user_id: user.id, _role: 'moderator' }),
        ]);
        setHasAccess(adminRes.data === true || modRes.data === true);
      } catch {
        setHasAccess(false);
      }
      setChecking(false);
    };
    checkAccess();
  }, [user]);

  if (checking) return null;

  if (hasAccess) return <MeetupsSection />;

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Blurred content behind */}
      <div className="filter blur-md pointer-events-none opacity-50">
        <MeetupsSection />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
        <div className="nostalgia-card p-8 max-w-md text-center border-primary/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl mb-2">UNDER UTVECKLING</h2>
          <p className="text-muted-foreground">
            Denna sektion öppnar senare under Alpha-perioden!
          </p>
        </div>
      </div>
    </div>
  );
}
