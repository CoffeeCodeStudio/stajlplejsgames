import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

export function SettingsPasswordChange() {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Fel", description: "Lösenordet måste vara minst 6 tecken.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Fel", description: "Lösenorden matchar inte.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Klart!", description: "Lösenordet har uppdaterats." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="nostalgia-card p-5 space-y-3">
      <h2 className="font-bold text-foreground flex items-center gap-2">
        <Lock className="w-4 h-4" /> Byt lösenord
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="newPass">Nytt lösenord</Label>
          <Input id="newPass" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmPass">Bekräfta lösenord</Label>
          <Input id="confirmPass" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
        </div>
        <Button type="submit" size="sm" disabled={loading || !newPassword}>
          {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Sparar...</> : "Byt lösenord"}
        </Button>
      </form>
    </div>
  );
}
