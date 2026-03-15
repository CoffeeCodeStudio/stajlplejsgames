import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/Avatar";
import { useToast } from "@/hooks/use-toast";
import { Search, User, Trash2, Ban, Loader2, Mail, Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

interface Profile {
  id: string;
  username: string;
  user_id: string;
  created_at: string;
  avatar_url: string | null;
  city: string | null;
  status_message: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface AdminUserListProps {
  users: Profile[];
  userRoles: UserRole[];
  onRefresh: () => void;
}

export function AdminUserList({ users, userRoles, onRefresh }: AdminUserListProps) {
  const [userSearch, setUserSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{ type: "email" | "password"; userId: string; username: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const getUserRole = (userId: string) => {
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role || "user";
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete_user", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Användare raderad", description: `${username} och all data har raderats` });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Kunde inte radera", description: error.message || "Något gick fel", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSubmit = async () => {
    if (!editDialog || !editValue.trim()) return;
    setActionLoading(editDialog.userId);
    try {
      const action = editDialog.type === "email" ? "update_email" : "update_password";
      const body = editDialog.type === "email"
        ? { action, user_id: editDialog.userId, new_email: editValue }
        : { action, user_id: editDialog.userId, new_password: editValue };
      const { data, error } = await supabase.functions.invoke("admin-users", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: editDialog.type === "email" ? "E-post ändrad" : "Lösenord ändrat",
        description: `Uppdaterat för ${editDialog.username}`,
      });
      setEditDialog(null);
      setEditValue("");
    } catch (err: any) {
      toast({ title: "Fel", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    setActionLoading(userId);
    try {
      // Add "banned" role
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: "banned" as any }, { onConflict: "user_id,role" });

      if (error) throw error;

      toast({
        title: "Användare bannlyst",
        description: `${username} kan inte längre logga in`,
      });
      onRefresh();
    } catch (error) {
      console.error("Ban user error:", error);
      toast({
        title: "Kunde inte bannlysa",
        description: "Något gick fel",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole as any });

      if (error) throw error;

      toast({
        title: "Roll ändrad",
        description: `Rollen har uppdaterats till ${newRole}`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Kunde inte ändra roll",
        description: "Något gick fel",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="nostalgia-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Alla medlemmar ({users.length})</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Sök användare..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-nostalgic">
        {filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Inga användare hittades
          </p>
        ) : (
          filteredUsers.map((profile) => {
            const currentRole = getUserRole(profile.user_id);
            const isBanned = currentRole === "banned";

            return (
              <div
                key={profile.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isBanned
                    ? "bg-destructive/10 border border-destructive/30"
                    : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <Avatar name={profile.username} src={profile.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/profile/${encodeURIComponent(profile.username)}`)}
                  >
                    {profile.username}
                    {isBanned && <span className="ml-2 text-destructive text-xs">(BANNLYST)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.city && `${profile.city} • `}
                    Registrerad {new Date(profile.created_at).toLocaleDateString("sv-SE")}
                  </p>
                </div>

                {/* Role selector */}
                <Select
                  value={currentRole}
                  onValueChange={(val) => handleRoleChange(profile.user_id, val)}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Användare</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => navigate(`/profile/${encodeURIComponent(profile.username)}`)}
                    title="Visa profil"
                  >
                    <User className="w-4 h-4" />
                  </Button>

                  {/* Edit email */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => { setEditDialog({ type: "email", userId: profile.user_id, username: profile.username }); setEditValue(""); }}
                    title="Ändra e-post"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>

                  {/* Edit password */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => { setEditDialog({ type: "password", userId: profile.user_id, username: profile.username }); setEditValue(""); }}
                    title="Ändra lösenord"
                  >
                    <Lock className="w-4 h-4" />
                  </Button>

                  {/* Ban button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-orange-500"
                        disabled={actionLoading === profile.user_id}
                        title="Bannlys användare"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bannlys {profile.username}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Denna användare kommer inte kunna logga in igen. Du kan ta bort bannlysningen genom att ändra rollen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleBanUser(profile.user_id, profile.username)}>
                          Bannlys
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Delete button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={actionLoading === profile.user_id}
                        title="Radera användare helt"
                      >
                        {actionLoading === profile.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Radera {profile.username}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Detta raderar profilen och ALL tillhörande data (meddelanden, gästboksinlägg, vänner, klotter etc). Det går inte att ångra.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteUser(profile.user_id, profile.username)}
                        >
                          Radera permanent
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit email/password dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => { if (!open) setEditDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog?.type === "email" ? "Ändra e-post" : "Ändra lösenord"} för {editDialog?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{editDialog?.type === "email" ? "Ny e-postadress" : "Nytt lösenord"}</Label>
              <Input
                type={editDialog?.type === "email" ? "email" : "password"}
                placeholder={editDialog?.type === "email" ? "ny@email.se" : "••••••••"}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Avbryt</Button>
            <Button onClick={handleEditSubmit} disabled={!editValue.trim() || actionLoading !== null}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
