import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, ImageIcon } from "lucide-react";

interface AvatarUpload {
  id: string;
  user_id: string;
  image_url: string;
  status: string;
  denial_reason: string | null;
  created_at: string;
  username?: string;
}

export function AdminImageReview() {
  const [uploads, setUploads] = useState<AvatarUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [denyReasons, setDenyReasons] = useState<Record<string, string>>({});
  const [showDenyInput, setShowDenyInput] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUploads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("avatar_uploads")
      .select("*")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Fetch usernames for each upload
      const userIds = data.map((u: any) => u.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const enriched = data.map((upload: any) => ({
        ...upload,
        username: profiles?.find((p: any) => p.user_id === upload.user_id)?.username || "Okänd",
      }));
      setUploads(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleApprove = async (upload: AvatarUpload) => {
    setActionLoading(upload.id);
    try {
      // Update upload status
      await supabase
        .from("avatar_uploads")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", upload.id);

      // Set the profile avatar_url to the approved image
      await supabase
        .from("profiles")
        .update({ avatar_url: upload.image_url })
        .eq("user_id", upload.user_id);

      toast({ title: "Bild godkänd", description: `${upload.username}s profilbild har godkänts.` });
      fetchUploads();
    } catch {
      toast({ title: "Fel", description: "Kunde inte godkänna bilden.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (upload: AvatarUpload) => {
    const reason = denyReasons[upload.id]?.trim();
    if (!reason) {
      toast({ title: "Motivering krävs", description: "Ange en anledning till nekandet.", variant: "destructive" });
      return;
    }

    setActionLoading(upload.id);
    try {
      await supabase
        .from("avatar_uploads")
        .update({
          status: "denied",
          denial_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", upload.id);

      // Send notification message to user
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (adminProfile) {
        await supabase.from("messages").insert({
          sender_id: adminProfile.user_id,
          recipient_id: upload.user_id,
          subject: "Din profilbild nekades",
          content: `Din uppladdade profilbild har nekats av en moderator.\n\nAnledning: ${reason}\n\nVänligen ladda upp en ny bild som följer reglerna (ansiktsbild med god kvalitet).`,
        });
      }

      toast({ title: "Bild nekad", description: `${upload.username} har meddelats.` });
      setShowDenyInput(null);
      setDenyReasons((prev) => ({ ...prev, [upload.id]: "" }));
      fetchUploads();
    } catch {
      toast({ title: "Fel", description: "Kunde inte neka bilden.", variant: "destructive" });
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
      <div className="flex items-center gap-3 mb-6">
        <ImageIcon className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">Bildgranskning</h2>
        <span className="text-sm text-muted-foreground">({uploads.length} väntande)</span>
      </div>

      {uploads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Inga bilder väntar på granskning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploads.map((upload) => (
            <div key={upload.id} className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="aspect-square bg-muted">
                <img
                  src={upload.image_url}
                  alt={`Uppladdning från ${upload.username}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm">{upload.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(upload.created_at).toLocaleDateString("sv-SE")}
                </p>

                {showDenyInput === upload.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Motivering (t.ex. 'Ej en ansiktsbild')"
                      value={denyReasons[upload.id] || ""}
                      onChange={(e) =>
                        setDenyReasons((prev) => ({ ...prev, [upload.id]: e.target.value }))
                      }
                      className="text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeny(upload)}
                        disabled={actionLoading === upload.id}
                        className="flex-1"
                      >
                        {actionLoading === upload.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Neka"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDenyInput(null)}
                        className="flex-1"
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(upload)}
                      disabled={actionLoading === upload.id}
                      className="flex-1"
                    >
                      {actionLoading === upload.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" /> Godkänn
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDenyInput(upload.id)}
                      disabled={actionLoading === upload.id}
                      className="flex-1"
                    >
                      <X className="w-3 h-3 mr-1" /> Neka
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
