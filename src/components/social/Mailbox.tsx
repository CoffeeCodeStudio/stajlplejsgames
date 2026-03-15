import { useState, useEffect } from "react";
import { Mail, Send, Inbox, Star, Trash2, ArrowLeft, Reply, Info, Loader2, Users } from "lucide-react";
import { Avatar } from "../Avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MailMessage {
  id: string;
  from: string;
  fromAvatar?: string;
  fromUserId: string;
  subject: string;
  preview: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
}

interface RecipientOption {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

// No demo data - only real messages from database

type MailView = "inbox" | "compose" | "read";

interface MailboxProps {
  onUnreadCountChange?: (count: number) => void;
  initialRecipient?: string;
}

export function Mailbox({ onUnreadCountChange, initialRecipient }: MailboxProps) {
  const [mails, setMails] = useState<MailMessage[]>([]);
  const [view, setView] = useState<MailView>("inbox");
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const [composeData, setComposeData] = useState({ to: initialRecipient || "", subject: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState<RecipientOption[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLoggedOut = !authLoading && !user;

  // Fetch mails from database
  useEffect(() => {
    if (isLoggedOut) {
      setMails([]);
      setLoading(false);
      return;
    }

    if (!user) {
      setMails([]);
      setLoading(false);
      return;
    }

    const fetchMails = async () => {
      setLoading(true);
      try {
        // Get messages where user is recipient
        const { data: messages, error } = await supabase
          .from("messages")
          .select("*")
          .eq("recipient_id", user.id)
          .eq("deleted_by_recipient", false)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!messages || messages.length === 0) {
          setMails([]);
          setLoading(false);
          return;
        }

        // Get sender profiles
        const senderIds = [...new Set(messages.map((m) => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", senderIds);

        // Map to MailMessage format
        const mailList: MailMessage[] = messages.map((msg) => {
          const sender = profiles?.find((p) => p.user_id === msg.sender_id);
          const createdAt = new Date(msg.created_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

          let timestamp: string;
          if (diffDays === 0) {
            timestamp = createdAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
          } else if (diffDays === 1) {
            timestamp = "igår";
          } else if (diffDays < 7) {
            timestamp = `${diffDays} dagar sedan`;
          } else {
            timestamp = createdAt.toLocaleDateString("sv-SE");
          }

          return {
            id: msg.id,
            from: sender?.username || "Okänd",
            fromAvatar: sender?.avatar_url || undefined,
            fromUserId: msg.sender_id,
            subject: msg.subject,
            preview: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
            content: msg.content,
            timestamp,
            isRead: msg.is_read,
            isStarred: msg.is_starred,
          };
        });

        setMails(mailList);
      } catch (error) {
        console.error("Error fetching mails:", error);
        toast({
          title: "Kunde inte hämta mejl",
          description: "Försök igen senare",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMails();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchMails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoggedOut, toast]);

  // Report unread count to parent
  const unreadCount = mails.filter((m) => !m.isRead).length;
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Search recipients
  const handleRecipientSearch = async (query: string) => {
    setComposeData({ ...composeData, to: query });

    if (!query.trim() || !user) {
      setRecipientSearch([]);
      return;
    }

    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .ilike("username", `%${query}%`)
        .neq("user_id", user.id)
        .limit(5);

      setRecipientSearch(data || []);
    } catch (error) {
      console.error("Error searching recipients:", error);
    }
  };

  const openMail = async (mail: MailMessage) => {
    if (isLoggedOut) return;
    setSelectedMail(mail);
    setView("read");

    // Mark as read
    if (!mail.isRead && user) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", mail.id);

      setMails((prev) =>
        prev.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m))
      );
    }
  };

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoggedOut || !user) return;

    const mail = mails.find((m) => m.id === id);
    if (!mail) return;

    await supabase
      .from("messages")
      .update({ is_starred: !mail.isStarred })
      .eq("id", id);

    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m))
    );
  };

  const handleSend = async () => {
    if (!user || !selectedRecipient) return;

    if (!composeData.subject.trim() || !composeData.message.trim()) {
      toast({
        title: "Fyll i alla fält",
        description: "Ämne och meddelande krävs",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedRecipient.user_id,
        subject: composeData.subject.trim(),
        content: composeData.message.trim(),
      });

      if (error) throw error;

      toast({
        title: "Mejl skickat!",
        description: `Meddelande skickat till ${selectedRecipient.username}`,
      });

      setComposeData({ to: "", subject: "", message: "" });
      setSelectedRecipient(null);
      setView("inbox");
    } catch (error) {
      console.error("Error sending mail:", error);
      toast({
        title: "Kunde inte skicka",
        description: "Försök igen senare",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMail || !user) return;

    try {
      await supabase
        .from("messages")
        .update({ deleted_by_recipient: true })
        .eq("id", selectedMail.id);

      setMails((prev) => prev.filter((m) => m.id !== selectedMail.id));
      setView("inbox");
      setSelectedMail(null);

      toast({
        title: "Mejl raderat",
      });
    } catch (error) {
      console.error("Error deleting mail:", error);
    }
  };

  const handleReply = () => {
    if (!selectedMail) return;
    
    // Find the sender's profile to set as recipient
    setSelectedRecipient({
      user_id: selectedMail.fromUserId,
      username: selectedMail.from,
      avatar_url: selectedMail.fromAvatar || null,
    });
    
    setComposeData({
      to: selectedMail.from,
      subject: `Re: ${selectedMail.subject}`,
      message: "",
    });
    setView("compose");
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Login prompt for logged out users */}
        {isLoggedOut && (
          <div className="nostalgia-card p-3 mb-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">Logga in</button> för att se din inkorg!
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="nostalgia-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl mb-1 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Mejl
              </h1>
              <p className="text-sm text-muted-foreground">
                {loading ? "Laddar..." : unreadCount > 0 ? `${unreadCount} olästa meddelanden` : "Inga nya meddelanden"}
              </p>
            </div>
            {view === "inbox" && !isLoggedOut && (
              <Button variant="msn" onClick={() => setView("compose")}>
                <Send className="w-4 h-4 mr-2" />
                Skriv nytt
              </Button>
            )}
            {view === "inbox" && isLoggedOut && (
              <Button variant="msn" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
            )}
          </div>
        </div>

        {/* Back button for non-inbox views */}
        {view !== "inbox" && (
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => {
              setView("inbox");
              setSelectedMail(null);
              setSelectedRecipient(null);
              setRecipientSearch([]);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till inkorg
          </Button>
        )}

        {/* Loading state */}
        {loading && !isLoggedOut && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Inbox View */}
        {view === "inbox" && !loading && (
          <div className="nostalgia-card overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
              <Inbox className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Inkorg</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="divide-y divide-border">
              {mails.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-lg font-semibold text-muted-foreground mb-1">🌟 Här var det tomt!</p>
                  <p className="text-sm text-muted-foreground">Nya meddelanden dyker upp här</p>
                </div>
              ) : (
                mails.map((mail) => (
                  <button
                    key={mail.id}
                    onClick={() => openMail(mail)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-3",
                      !mail.isRead && "bg-primary/5",
                      isLoggedOut && "cursor-default opacity-80"
                    )}
                    disabled={isLoggedOut}
                  >
                    <Avatar name={mail.from} src={mail.fromAvatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm", !mail.isRead && "font-semibold")}>
                          {mail.from}
                        </span>
                        <span className="text-xs text-muted-foreground">{mail.timestamp}</span>
                      </div>
                      <p className={cn("text-sm truncate", !mail.isRead ? "text-foreground" : "text-muted-foreground")}>
                        {mail.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{mail.preview}</p>
                    </div>
                    <button
                      onClick={(e) => toggleStar(mail.id, e)}
                      className={cn(
                        "p-1 transition-colors",
                        mail.isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500",
                        isLoggedOut && "pointer-events-none"
                      )}
                      disabled={isLoggedOut}
                    >
                      <Star className={cn("w-4 h-4", mail.isStarred && "fill-current")} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Read Mail View */}
        {view === "read" && selectedMail && (
          <div className="nostalgia-card p-4">
            <div className="flex items-start gap-3 mb-4">
              <Avatar name={selectedMail.from} src={selectedMail.fromAvatar} size="md" />
              <div className="flex-1">
                <h2 className="font-semibold">{selectedMail.subject}</h2>
                <p className="text-sm text-muted-foreground">
                  Från: <span className="text-foreground">{selectedMail.from}</span>
                </p>
                <p className="text-xs text-muted-foreground">{selectedMail.timestamp}</p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm whitespace-pre-line text-foreground">{selectedMail.content}</p>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="msn" onClick={handleReply}>
                <Reply className="w-4 h-4 mr-2" />
                Svara
              </Button>
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Radera
              </Button>
            </div>
          </div>
        )}

        {/* Compose View */}
        {view === "compose" && (
          <div className="nostalgia-card p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Skriv nytt mejl
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-medium text-muted-foreground uppercase">Till</label>
                {selectedRecipient ? (
                  <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded-md">
                    <Avatar name={selectedRecipient.username} src={selectedRecipient.avatar_url} size="sm" />
                    <span className="text-sm font-medium">{selectedRecipient.username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-6 w-6 p-0"
                      onClick={() => {
                        setSelectedRecipient(null);
                        setComposeData({ ...composeData, to: "" });
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      value={composeData.to}
                      onChange={(e) => handleRecipientSearch(e.target.value)}
                      placeholder="Sök användarnamn..."
                      className="mt-1"
                    />
                    {recipientSearch.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg">
                        {recipientSearch.map((recipient) => (
                          <button
                            key={recipient.user_id}
                            onClick={() => {
                              setSelectedRecipient(recipient);
                              setComposeData({ ...composeData, to: recipient.username });
                              setRecipientSearch([]);
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors text-left"
                          >
                            <Avatar name={recipient.username} src={recipient.avatar_url} size="sm" />
                            <span className="text-sm">{recipient.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Ämne</label>
                <Input
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Skriv ämne..."
                  className="mt-1"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Meddelande</label>
                <Textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  placeholder="Skriv ditt meddelande..."
                  rows={6}
                  className="mt-1"
                  maxLength={5000}
                />
                <span className="text-xs text-muted-foreground">{composeData.message.length}/5000</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setView("inbox");
                    setSelectedRecipient(null);
                    setRecipientSearch([]);
                    setComposeData({ to: "", subject: "", message: "" });
                  }}
                >
                  Avbryt
                </Button>
                <Button
                  variant="msn"
                  onClick={handleSend}
                  disabled={sending || !selectedRecipient || !composeData.subject.trim() || !composeData.message.trim()}
                >
                  {sending ? (
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
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
