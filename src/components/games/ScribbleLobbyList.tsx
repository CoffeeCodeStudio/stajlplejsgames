import { useState } from "react";
import { useScribbleLobbies } from "@/hooks/useScribble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Gamepad2, Plus, Users, Clock } from "lucide-react";

interface ScribbleLobbyListProps {
  onJoinLobby: (lobbyId: string) => void;
}

export function ScribbleLobbyList({ onJoinLobby }: ScribbleLobbyListProps) {
  const { lobbies, loading, createLobby } = useScribbleLobbies();
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
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="container px-4 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">Scribble</h1>
              <p className="text-sm text-muted-foreground">Rita & gissa med vänner!</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="font-display gap-2">
            <Plus className="w-4 h-4" />
            Skapa ny spelomgång
          </Button>
        </div>

        {/* Lobby List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Laddar lobbys...</div>
        ) : lobbies.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">Inga aktiva lobbys just nu.</p>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="font-display gap-2">
              <Plus className="w-4 h-4" />
              Skapa den första!
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lobbies.map((lobby) => (
              <div
                key={lobby.id}
                className="rounded-xl border-2 border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
              >
                {/* Orange title bar */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-white truncate">{lobby.title}</h3>
                  <span className="text-xs text-white/80 font-mono capitalize">
                    {lobby.status === "waiting" ? "Väntar" : "Spelar"}
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {lobby.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{lobby.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                  <Button
                    size="sm"
                    onClick={() => onJoinLobby(lobby.id)}
                    className="font-display shrink-0"
                  >
                    Hoppa in
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Skapa ny spelomgång</DialogTitle>
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
              <Button variant="outline" onClick={() => setShowCreate(false)}>Avbryt</Button>
              <Button onClick={handleCreate} disabled={!title.trim() || creating} className="font-display">
                {creating ? "Skapar..." : "Skapa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
