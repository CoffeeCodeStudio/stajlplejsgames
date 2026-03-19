import { useState } from "react";
import { useScribbleLobbies } from "@/hooks/useScribble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Plus, Users, Clock } from "lucide-react";

interface ScribbleLobbyListProps {
  onJoinLobby: (lobbyId: string) => void;
  guestId: string;
  guestUsername: string | null;
}

export function ScribbleLobbyList({ onJoinLobby, guestId, guestUsername }: ScribbleLobbyListProps) {
  const { lobbies, loading, createLobby } = useScribbleLobbies(guestId, guestUsername);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const lobby = await createLobby(title.trim(), description.trim());
    setCreating(false);
    if (lobby) {
      setShowCreate(false);
      setTitle("");
      setDescription("");
      onJoinLobby(lobby.id);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) +
          " " +
          d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-3 py-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="retro-panel mb-4">
          <div className="retro-panel-header flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            <span>Klottra & Gissa</span>
          </div>
          <div className="retro-panel-body flex items-center justify-between gap-3">
            <p className="text-base font-bold text-foreground">
              Rita & gissa med vänner!
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="retro-btn retro-btn-primary font-pixel text-[8px] gap-1 whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              Nytt spel
            </button>
          </div>
        </div>

        {/* Lobby List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Laddar lobbys...</div>
        ) : lobbies.length === 0 ? (
          <div className="retro-panel">
            <div className="retro-panel-body text-center py-6">
              <Pencil className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-3">Inga aktiva lobbys just nu.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="retro-btn retro-btn-primary font-pixel text-[8px] gap-1"
              >
                <Plus className="w-3 h-3" />
                Skapa den första!
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {lobbies.map((lobby) => (
              <div
                key={lobby.id}
                className="retro-panel hover:border-primary/60 transition-colors"
              >
                {/* Orange title bar */}
                <div className="retro-panel-header flex items-center justify-between">
                  <span className="truncate">{lobby.title}</span>
                  <span className="text-[7px] opacity-80 capitalize ml-2 shrink-0">
                    {lobby.status === "waiting" ? "Väntar" : "Spelar"}
                  </span>
                </div>

                <div className="retro-panel-body flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {lobby.description && (
                      <p className="text-sm text-muted-foreground mb-1 line-clamp-1">{lobby.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Av: <strong className="text-foreground">{lobby.creator_username}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(lobby.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {lobby.player_count || 0}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinLobby(lobby.id)}
                    className="retro-btn retro-btn-primary font-pixel text-[8px] shrink-0"
                  >
                    Hoppa in
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-pixel text-xs">Skapa ny spelomgång</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Rubrik</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="T.ex. Vi ritar djur!"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Kort info</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="T.ex. Bara roliga grejer!"
                  maxLength={140}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <button className="retro-btn" onClick={() => setShowCreate(false)}>Avbryt</button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || creating}
                className="retro-btn retro-btn-primary font-pixel text-[8px] disabled:opacity-50"
              >
                {creating ? "Skapar..." : "Skapa"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
