import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Trash2, Loader2 } from "lucide-react";

interface DailyNewsItem {
  id: string;
  content: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export function AdminDailyNews() {
  const [newsText, setNewsText] = useState("");
  const [items, setItems] = useState<DailyNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setItems(data as DailyNewsItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async () => {
    if (!newsText.trim() || newsText.trim().length > 500) {
      toast({ title: "Felaktigt innehåll", description: "Max 500 tecken.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("daily_news").insert({
      content: newsText.trim(),
      is_active: true,
    });
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sparat!", description: "Bottarna kommer börja prata om detta inom kort." });
      setNewsText("");
      fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("daily_news").delete().eq("id", id);
    toast({ title: "Borttaget" });
    fetchItems();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await supabase.from("daily_news").update({ is_active: !isActive }).eq("id", id);
    fetchItems();
  };

  return (
    <div className="nostalgia-card p-6 space-y-4">
      <h2 className="font-display font-bold text-lg flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        Dagens Nyhet
      </h2>
      <p className="text-sm text-muted-foreground">
        Skriv ett ämne här så börjar bottarna prata om det i Lajv och gästböcker under de närmaste 24 timmarna.
      </p>

      <Textarea
        value={newsText}
        onChange={(e) => setNewsText(e.target.value)}
        placeholder="T.ex. 'Echo2000 fyller 1 år idag!' eller 'Vad tycker ni om nya designen?'"
        className="min-h-[80px]"
        maxLength={500}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{newsText.length}/500</span>
        <Button onClick={handleSubmit} disabled={saving || !newsText.trim()}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Megaphone className="w-4 h-4 mr-2" />}
          Publicera
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : items.length > 0 ? (
        <div className="space-y-2 mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Aktiva & tidigare ämnen</h3>
          {items.map((item) => {
            const isExpired = new Date(item.expires_at) < new Date();
            const isActive = item.is_active && !isExpired;
            return (
              <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isActive ? "border-primary/30 bg-primary/5" : "border-border opacity-60"}`}>
                <div className="flex-1">
                  <p className="text-sm">{item.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.created_at).toLocaleString("sv-SE")}
                    {isActive ? " · ✅ Aktiv" : isExpired ? " · ⏰ Utgången" : " · ⏸️ Pausad"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!isExpired && (
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(item.id, item.is_active)}>
                      {item.is_active ? "Pausa" : "Aktivera"}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
