import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PendingUser {
  id: string;
  username: string;
  user_id: string;
  created_at: string;
  avatar_url: string | null;
}

interface AdminPendingApprovalsProps {
  onRefresh: () => void;
}

export function AdminPendingApprovals({ onRefresh }: AdminPendingApprovalsProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list_pending" },
      });
      if (error) throw error;
      setPendingUsers(data.users || []);
    } catch (err) {
      console.error("Fetch pending error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (userId: string, username: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "approve_user", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Godkänd!", description: `${username} kan nu logga in.` });
      fetchPending();
      onRefresh();
    } catch (err: any) {
      toast({ title: "Fel", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (userId: string, username: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "deny_user", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Nekad", description: `${username} har tagits bort.` });
      fetchPending();
      onRefresh();
    } catch (err: any) {
      toast({ title: "Fel", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="nostalgia-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Väntande medlemmar ({pendingUsers.length})
        </h2>
        <Button variant="ghost" size="icon" onClick={fetchPending} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : pendingUsers.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Inga väntande ansökningar 🎉
        </p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-nostalgic">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-primary/20"
            >
              <Avatar name={user.username} src={user.avatar_url} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  Registrerad {new Date(user.created_at).toLocaleDateString("sv-SE")}{" "}
                  {new Date(user.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(user.user_id, user.username)}
                  disabled={actionLoading === user.user_id}
                  className="gap-1"
                >
                  {actionLoading === user.user_id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Godkänn
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading === user.user_id}
                      className="gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      Neka
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Neka {user.username}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Kontot och all data raderas permanent.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground"
                        onClick={() => handleDeny(user.user_id, user.username)}
                      >
                        Neka och radera
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
