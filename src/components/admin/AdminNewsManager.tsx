import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Newspaper, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  icon: string;
  author_name: string;
  is_published: boolean;
  created_at: string;
}

export function AdminNewsManager() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", content: "", icon: "📢", image_url: "" });
  const { toast } = useToast();

  const fetchArticles = async () => {
    const { data } = await supabase.from("news_articles").select("*").order("created_at", { ascending: false });
    if (data) setArticles(data as NewsArticle[]);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const createArticle = async () => {
    if (!newArticle.title || !newArticle.content) {
      toast({ title: "Fyll i rubrik och innehåll", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("news_articles").insert({
      title: newArticle.title,
      content: newArticle.content,
      icon: newArticle.icon,
      image_url: newArticle.image_url || null,
    });
    if (error) toast({ title: "Fel", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Nyhet skapad!" });
      setShowCreate(false);
      setNewArticle({ title: "", content: "", icon: "📢", image_url: "" });
      fetchArticles();
    }
  };

  const updateArticle = async (article: NewsArticle) => {
    setSaving(article.id);
    const { error } = await supabase.from("news_articles").update({
      title: article.title,
      content: article.content,
      icon: article.icon,
      image_url: article.image_url,
      is_published: article.is_published,
    }).eq("id", article.id);
    if (error) toast({ title: "Fel", description: error.message, variant: "destructive" });
    else toast({ title: "Uppdaterad!" });
    setSaving(null);
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase.from("news_articles").delete().eq("id", id);
    if (!error) {
      setArticles(prev => prev.filter(a => a.id !== id));
      toast({ title: "Nyhet borttagen" });
    }
  };

  const updateField = (id: string, field: keyof NewsArticle, value: any) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" /> Nyheter
        </h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />Ny nyhet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Skapa nyhet</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Rubrik" value={newArticle.title} onChange={e => setNewArticle(p => ({ ...p, title: e.target.value }))} />
              <Input placeholder="Ikon (emoji)" value={newArticle.icon} onChange={e => setNewArticle(p => ({ ...p, icon: e.target.value }))} />
              <Input placeholder="Bild-URL (valfritt)" value={newArticle.image_url} onChange={e => setNewArticle(p => ({ ...p, image_url: e.target.value }))} />
              <Textarea placeholder="Innehåll..." value={newArticle.content} onChange={e => setNewArticle(p => ({ ...p, content: e.target.value }))} rows={4} />
              <Button onClick={createArticle} className="w-full">Publicera</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {articles.length === 0 ? (
        <div className="nostalgia-card p-6 text-center">
          <Newspaper className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Inga nyheter ännu.</p>
        </div>
      ) : (
        articles.map(article => (
          <div key={article.id} className="nostalgia-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">{article.icon} {article.title}</span>
              <Switch checked={article.is_published} onCheckedChange={v => updateField(article.id, "is_published", v)} />
            </div>
            <Input value={article.title} onChange={e => updateField(article.id, "title", e.target.value)} />
            <div className="flex gap-2">
              <Input value={article.icon} onChange={e => updateField(article.id, "icon", e.target.value)} className="w-16" />
              <Input value={article.image_url || ""} onChange={e => updateField(article.id, "image_url", e.target.value)} placeholder="Bild-URL" className="flex-1" />
            </div>
            <Textarea value={article.content} onChange={e => updateField(article.id, "content", e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => updateArticle(article)} disabled={saving === article.id}>
                {saving === article.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}Spara
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteArticle(article.id)}>
                <Trash2 className="w-3 h-3 mr-1" />Ta bort
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
