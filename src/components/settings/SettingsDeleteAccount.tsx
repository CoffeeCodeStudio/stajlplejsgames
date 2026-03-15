import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

export function SettingsDeleteAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.rpc("delete_user_cascade", { p_user_id: user.id });
      if (error) throw error;
      await signOut();
      toast({ title: "Kontot raderat", description: "Ditt konto och all data har raderats permanent." });
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Fel", description: err.message || "Kunde inte radera kontot.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nostalgia-card p-5 space-y-3 border-destructive/30">
      <h2 className="font-bold text-destructive flex items-center gap-2">
        <Trash2 className="w-4 h-4" /> Radera konto
      </h2>
      <p className="text-sm text-muted-foreground">
        Detta raderar ditt konto och all tillhörande data permanent. Det går inte att ångra.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Raderar...</> : "Radera mitt konto permanent"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta går inte att ångra. Ditt konto och all tillhörande data (meddelanden, vänner, inlägg) raderas permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ja, radera mitt konto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
