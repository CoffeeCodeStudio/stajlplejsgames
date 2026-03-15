import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

export function SettingsEmailChange() {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Klart!", description: "En bekräftelselänk har skickats till din nya e-post." });
      setNewEmail("");
    }
  };

  return (
    <div className="nostalgia-card p-5 space-y-3">
      <h2 className="font-bold text-foreground flex items-center gap-2">
        <Mail className="w-4 h-4" /> Ändra e-post
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="newEmail">Ny e-postadress</Label>
          <Input id="newEmail" type="email" placeholder="ny@email.se" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={loading} />
        </div>
        <Button type="submit" size="sm" disabled={loading || !newEmail.trim()}>
          {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Sparar...</> : "Uppdatera e-post"}
        </Button>
      </form>
    </div>
  );
}
