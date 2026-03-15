import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, MessageSquare, Paintbrush } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GuestbookEntry {
  id: string;
  author_name: string;
  author_avatar: string | null;
  message: string;
  created_at: string;
  user_id: string;
}

interface KlotterEntry {
  id: string;
  author_name: string;
  author_avatar: string | null;
  comment: string | null;
  image_url: string;
  created_at: string;
  user_id: string;
}

export function AdminContentModeration() {
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [klotterEntries, setKlotterEntries] = useState<KlotterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContent = async () => {
    setLoading(true);
    const [guestbook, klotter] = await Promise.all([
      supabase
        .from("guestbook_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("klotter")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (guestbook.data) setGuestbookEntries(guestbook.data);
    if (klotter.data) setKlotterEntries(klotter.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleDeleteGuestbook = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from("guestbook_entries").delete().eq("id", id);
      if (error) throw error;
      setGuestbookEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Inlägg raderat" });
    } catch {
      toast({ title: "Kunde inte radera", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteKlotter = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from("klotter").delete().eq("id", id);
      if (error) throw error;
      setKlotterEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Klotter raderat" });
    } catch {
      toast({ title: "Kunde inte radera", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="nostalgia-card p-6">
      <h2 className="font-semibold text-lg mb-4">Innehålls-moderering</h2>

      <Tabs defaultValue="guestbook">
        <TabsList className="mb-4">
          <TabsTrigger value="guestbook" className="gap-1">
            <MessageSquare className="w-4 h-4" />
            Gästbok ({guestbookEntries.length})
          </TabsTrigger>
          <TabsTrigger value="klotter" className="gap-1">
            <Paintbrush className="w-4 h-4" />
            Klotter ({klotterEntries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guestbook">
          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-nostalgic">
            {guestbookEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Inga inlägg</p>
            ) : (
              guestbookEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar name={entry.author_name} src={entry.author_avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{entry.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString("sv-SE")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 break-words">{entry.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDeleteGuestbook(entry.id)}
                    disabled={actionLoading === entry.id}
                  >
                    {actionLoading === entry.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="klotter">
          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-nostalgic">
            {klotterEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Inga klotter</p>
            ) : (
              klotterEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar name={entry.author_name} src={entry.author_avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{entry.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString("sv-SE")}
                      </span>
                    </div>
                    {entry.comment && (
                      <p className="text-sm text-muted-foreground mt-1 break-words">{entry.comment}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDeleteKlotter(entry.id)}
                    disabled={actionLoading === entry.id}
                  >
                    {actionLoading === entry.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
