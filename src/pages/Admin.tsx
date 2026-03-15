import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, ArrowLeft, UserPlus, Users, Activity, ImageIcon, Bot, Newspaper, Clock, Megaphone, BarChart3 } from "lucide-react";
import { AdminUserList } from "@/components/admin/AdminUserList";
import { AdminCreateUser } from "@/components/admin/AdminCreateUser";
import { AdminContentModeration } from "@/components/admin/AdminContentModeration";
import { AdminImageReview } from "@/components/admin/AdminImageReview";
import { AdminBotManager } from "@/components/admin/AdminBotManager";
import { AdminNewsManager } from "@/components/admin/AdminNewsManager";
import { AdminPendingApprovals } from "@/components/admin/AdminPendingApprovals";
import { AdminBotSpawner } from "@/components/admin/AdminBotSpawner";
import { AdminDailyNews } from "@/components/admin/AdminDailyNews";
import { AdminBotActivity } from "@/components/admin/AdminBotActivity";

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

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "list" | "create" | "moderate" | "images" | "bots" | "news" | "daily" | "botactivity">("pending");

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) { setCheckingAdmin(false); return; }
      try {
        const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (error) throw error;
        setIsAdmin(data === true);
      } catch { setIsAdmin(false); }
      finally { setCheckingAdmin(false); }
    };
    if (!loading) checkAdminStatus();
  }, [user, loading]);

  const fetchData = async () => {
    if (!isAdmin) return;
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, username, user_id, created_at, avatar_url, city, status_message").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profilesRes.data) setUsers(profilesRes.data);
    if (rolesRes.data) setUserRoles(rolesRes.data as UserRole[]);
  };

  useEffect(() => { fetchData(); }, [isAdmin]);

  if (loading || checkingAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="nostalgia-card p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">Inloggning krävs</h1>
          <p className="text-muted-foreground mb-4">Du måste vara inloggad för att komma åt admin-panelen.</p>
          <Button onClick={() => navigate("/auth")}>Logga in</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="nostalgia-card p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-bold mb-2">Åtkomst nekad</h1>
          <p className="text-muted-foreground mb-4">Endast administratörer har åtkomst.</p>
          <Button onClick={() => navigate("/")}><ArrowLeft className="w-4 h-4 mr-2" />Tillbaka</Button>
        </div>
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    newThisMonth: users.filter((u) => {
      const created = new Date(u.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />Admin-panel
            </h1>
            <p className="text-muted-foreground text-sm">Hantera användare och innehåll</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}><ArrowLeft className="w-4 h-4 mr-2" />Tillbaka</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="nostalgia-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-sm text-muted-foreground">Totalt medlemmar</p></div>
          </div>
          <div className="nostalgia-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center"><UserPlus className="w-6 h-6 text-accent" /></div>
            <div><p className="text-2xl font-bold">{stats.newThisMonth}</p><p className="text-sm text-muted-foreground">Nya denna månad</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button variant={activeTab === "pending" ? "default" : "outline"} onClick={() => setActiveTab("pending")}>
            <Clock className="w-4 h-4 mr-2" />Väntande
          </Button>
          <Button variant={activeTab === "list" ? "default" : "outline"} onClick={() => setActiveTab("list")}>
            <Users className="w-4 h-4 mr-2" />Medlemmar
          </Button>
          <Button variant={activeTab === "create" ? "default" : "outline"} onClick={() => setActiveTab("create")}>
            <UserPlus className="w-4 h-4 mr-2" />Skapa användare
          </Button>
          <Button variant={activeTab === "moderate" ? "default" : "outline"} onClick={() => setActiveTab("moderate")}>
            <Activity className="w-4 h-4 mr-2" />Moderering
          </Button>
          <Button variant={activeTab === "images" ? "default" : "outline"} onClick={() => setActiveTab("images")}>
            <ImageIcon className="w-4 h-4 mr-2" />Bildgranskning
          </Button>
          <Button variant={activeTab === "bots" ? "default" : "outline"} onClick={() => setActiveTab("bots")}>
            <Bot className="w-4 h-4 mr-2" />AI-Botar
          </Button>
          <Button variant={activeTab === "news" ? "default" : "outline"} onClick={() => setActiveTab("news")}>
            <Newspaper className="w-4 h-4 mr-2" />Nyheter
          </Button>
          <Button variant={activeTab === "daily" ? "default" : "outline"} onClick={() => setActiveTab("daily")}>
            <Megaphone className="w-4 h-4 mr-2" />Dagens Nyhet
          </Button>
          <Button variant={activeTab === "botactivity" ? "default" : "outline"} onClick={() => setActiveTab("botactivity")}>
            <BarChart3 className="w-4 h-4 mr-2" />Bot-aktivitet
          </Button>
        </div>

        {activeTab === "pending" && <AdminPendingApprovals onRefresh={fetchData} />}
        {activeTab === "list" && <AdminUserList users={users} userRoles={userRoles} onRefresh={fetchData} />}
        {activeTab === "create" && <AdminCreateUser onUserCreated={fetchData} />}
        {activeTab === "moderate" && <AdminContentModeration />}
        {activeTab === "images" && <AdminImageReview />}
        {activeTab === "bots" && (
          <>
            <AdminBotSpawner />
            <AdminBotManager />
          </>
        )}
        {activeTab === "news" && <AdminNewsManager />}
        {activeTab === "daily" && <AdminDailyNews />}
        {activeTab === "botactivity" && <AdminBotActivity />}
      </div>
    </div>
  );
}
