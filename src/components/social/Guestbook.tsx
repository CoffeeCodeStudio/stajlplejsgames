import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Loader2, Info, Trash2, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Avatar } from "../Avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { GoodVibe } from "./GoodVibe";
import { EmotePicker, replaceEmoteCodes } from "./PixelEmotes";
import { ClickableUsername } from "../ClickableUsername";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface GuestbookEntry {
  id: string;
  author_name: string;
  author_avatar: string | null;
  message: string;
  created_at: string;
  user_id: string;
}

// No demo data - only real entries from database

export function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleReply = useCallback((authorName: string) => {
    // Clean reply - no @ or # prefixes
    setNewMessage('');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const isLoggedOut = !authLoading && !user;

  // Fetch entries on mount
  useEffect(() => {
    // Always fetch from database (public guestbook)
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching guestbook entries:", error);
        toast({
          title: "Kunde inte hämta inlägg",
          description: "Försök igen senare",
          variant: "destructive",
        });
      } else {
        setEntries(data || []);
      }
      setIsLoading(false);
    };

    fetchEntries();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("guestbook-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guestbook_entries",
        },
        (payload) => {
          setEntries((prev) => [payload.new as GuestbookEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;

    if (!user) {
      toast({
        title: "Logga in först",
        description: "Du måste vara inloggad för att skriva i gästboken",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Get user profile for username - prioritize username over email
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", user.id)
        .single();

      // Always use profile username if it exists and isn't the auto-generated one
      let authorName = "Anonym";
      if (profile?.username && !profile.username.startsWith("user_")) {
        authorName = profile.username;
      } else if (user.email) {
        authorName = user.email.split("@")[0];
      }
      
      const avatarUrl = profile?.avatar_url || null;

      const { error } = await supabase.from("guestbook_entries").insert({
        user_id: user.id,
        author_name: authorName,
        author_avatar: avatarUrl,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Inlägg skickat!",
        description: "Ditt meddelande har lagts till i gästboken",
      });
    } catch (error) {
      console.error("Error posting to guestbook:", error);
      toast({
        title: "Kunde inte skicka",
        description: "Något gick fel, försök igen",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("guestbook_entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", user.id);

      if (error) throw error;

      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast({
        title: "Inlägg raderat",
        description: "Ditt meddelande har tagits bort",
      });
    } catch (error) {
      console.error("Error deleting guestbook entry:", error);
      toast({
        title: "Kunde inte radera",
        description: "Något gick fel, försök igen",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `idag kl ${date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `igår kl ${date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return `${diffDays} dagar sedan`;
    } else {
      return date.toLocaleDateString("sv-SE");
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("guestbook_entries")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
      setEntries((prev) => prev.filter((e) => e.user_id !== user.id));
      toast({ title: "Gästboken rensad", description: "Alla dina inlägg har raderats." });
    } catch (error) {
      console.error("Error clearing guestbook:", error);
      toast({ title: "Kunde inte rensa", description: "Något gick fel, försök igen", variant: "destructive" });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-6 max-w-2xl mx-auto">
        <div className="nostalgia-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl mb-1">📖 Min Gästbok</h1>
              <p className="text-sm text-muted-foreground">
                Lämna ett meddelande så svarar jag så fort jag kan!
              </p>
            </div>
            {user && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    Rensa mina inlägg
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Rensa gästboken
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Är du säker på att du vill radera ALLA dina inlägg i gästboken? Detta går inte att ångra.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Ja, radera allt
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Write new entry */}
        <div ref={formRef} className="nostalgia-card p-4 mb-6">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Skriv i gästboken
          </h2>

          {!authLoading && !user ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">
                Du måste vara inloggad för att skriva i gästboken
              </p>
              <Button variant="msn" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
            </div>
          ) : (
            <>
              <div className="relative mb-3">
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Skriv ditt meddelande här... (använd t.ex. :fire: :love: :star:)"
                  rows={3}
                  disabled={isSending}
                  maxLength={500}
                />
                <div className="absolute bottom-2 left-2">
                  <EmotePicker onSelect={(code) => setNewMessage(prev => prev + " " + code + " ")} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {newMessage.length}/500 tecken
                </span>
                <Button
                  variant="msn"
                  onClick={handleSubmit}
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Skicka
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Entries */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="nostalgia-card p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-lg font-semibold text-muted-foreground mb-1">🌟 Här var det tomt!</p>
              <p className="text-sm text-muted-foreground">
                {user ? "Bli först att skriva!" : "Logga in för att skriva i gästboken!"}
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="nostalgia-card p-3">
                <div className="flex gap-3">
                  {/* Avatar only */}
                  <Avatar 
                    src={entry.author_avatar || undefined}
                    name={entry.author_name}
                    size="md"
                    showStatus={false}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {/* Header row with name and timestamp */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <ClickableUsername 
                        username={entry.author_name} 
                        nameClassName="font-semibold text-sm text-primary"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(entry.created_at)}
                        </span>
                        {/* Delete button - only show for own entries */}
                        {user && entry.user_id === user.id && (
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Radera inlägg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Message with high contrast */}
                    <p className="text-sm text-foreground/95 leading-relaxed">{replaceEmoteCodes(entry.message)}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                      <GoodVibe targetType="guestbook" targetId={entry.id} />
                      <button
                        onClick={() => handleReply(entry.author_name)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Svara
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
