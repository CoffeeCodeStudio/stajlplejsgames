import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Plus, Save, Trash2, Loader2, MessageCircle, BookOpen, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BotSetting {
  id: string;
  name: string;
  avatar_url: string | null;
  system_prompt: string;
  activity_level: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  allowed_contexts: string[];
  cron_interval: string;
}

const CONTEXT_OPTIONS = [
  { value: "chat", label: "Svara i Chatten" },
  { value: "guestbook", label: "Skriva i Gästboken" },
  { value: "news", label: "Kommentera Nyheter" },
];

const CRON_OPTIONS = [
  { value: "*/5 * * * *", label: "Var 5:e minut" },
  { value: "*/15 * * * *", label: "Var 15:e minut" },
  { value: "*/30 * * * *", label: "Var 30:e minut" },
  { value: "0 * * * *", label: "Varje timme" },
  { value: "0 */6 * * *", label: "Var 6:e timme" },
  { value: "0 9 * * *", label: "En gång om dagen (09:00)" },
];

export function AdminBotManager() {
  const [bots, setBots] = useState<BotSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [newBot, setNewBot] = useState({ name: "", system_prompt: "", user_id: "" });
  const { toast } = useToast();

  const fetchBots = async () => {
    const { data } = await supabase.from("bot_settings").select("*").order("created_at");
    if (data) setBots(data.map((b: any) => ({
      ...b,
      allowed_contexts: b.allowed_contexts || ["chat", "guestbook"],
      cron_interval: b.cron_interval || "*/5 * * * *",
    })));
    setLoading(false);
  };

  useEffect(() => { fetchBots(); }, []);

  const updateBot = async (bot: BotSetting) => {
    setSaving(bot.id);
    const { error } = await supabase.from("bot_settings").update({
      name: bot.name,
      avatar_url: bot.avatar_url,
      system_prompt: bot.system_prompt,
      activity_level: bot.activity_level,
      is_active: bot.is_active,
      allowed_contexts: bot.allowed_contexts,
      cron_interval: bot.cron_interval,
    } as any).eq("id", bot.id);
    
    if (error) toast({ title: "Fel", description: error.message, variant: "destructive" });
    else toast({ title: "Sparat", description: `${bot.name} uppdaterad.` });
    setSaving(null);
  };

  const createBot = async () => {
    if (!newBot.name || !newBot.user_id) {
      toast({ title: "Fyll i namn och user_id", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("bot_settings").insert({
      name: newBot.name,
      system_prompt: newBot.system_prompt,
      user_id: newBot.user_id,
    });
    if (error) toast({ title: "Fel", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Bot skapad!" });
      setShowCreate(false);
      setNewBot({ name: "", system_prompt: "", user_id: "" });
      fetchBots();
    }
  };

  const deleteBot = async (id: string) => {
    const { error } = await supabase.from("bot_settings").delete().eq("id", id);
    if (!error) {
      setBots(prev => prev.filter(b => b.id !== id));
      toast({ title: "Bot borttagen" });
    }
  };

  const testBot = async (bot: BotSetting, action: string) => {
    setTesting(bot.id);
    setTestResult("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action,
            bot_id: bot.id,
            context: action === "chat_reply" ? "Hej! Hur mår du idag?" : undefined,
          }),
        }
      );
      const data = await res.json();
      setTestResult(data.reply || data.error || "Inget svar");
    } catch (e) {
      setTestResult("Fel vid test");
    }
    setTesting(null);
  };

  const updateBotField = (id: string, field: keyof BotSetting, value: any) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const toggleContext = (botId: string, context: string) => {
    setBots(prev => prev.map(b => {
      if (b.id !== botId) return b;
      const contexts = b.allowed_contexts.includes(context)
        ? b.allowed_contexts.filter(c => c !== context)
        : [...b.allowed_contexts, context];
      return { ...b, allowed_contexts: contexts };
    }));
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" /> AI-Botar
        </h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />Ny bot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Skapa ny bot</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Namn (t.ex. BotAdam)" value={newBot.name} onChange={e => setNewBot(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="User ID (UUID från profiles)" value={newBot.user_id} onChange={e => setNewBot(p => ({ ...p, user_id: e.target.value }))} />
              <Textarea placeholder="System prompt / personlighet..." value={newBot.system_prompt} onChange={e => setNewBot(p => ({ ...p, system_prompt: e.target.value }))} rows={4} />
              <Button onClick={createBot} className="w-full">Skapa bot</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bots.length === 0 ? (
        <div className="nostalgia-card p-6 text-center">
          <Bot className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Inga botar konfigurerade ännu.</p>
        </div>
      ) : (
        bots.map(bot => (
          <div key={bot.id} className="nostalgia-card p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-bold">{bot.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${bot.is_active ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                  {bot.is_active ? "Aktiv" : "Inaktiv"}
                </span>
              </div>
              <Switch checked={bot.is_active} onCheckedChange={v => updateBotField(bot.id, "is_active", v)} />
            </div>

            {/* Basic settings */}
            <div className="grid gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Namn</label>
                <Input value={bot.name} onChange={e => updateBotField(bot.id, "name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Avatar URL</label>
                <Input value={bot.avatar_url || ""} onChange={e => updateBotField(bot.id, "avatar_url", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">System Prompt (Personlighet)</label>
                <Textarea value={bot.system_prompt} onChange={e => updateBotField(bot.id, "system_prompt", e.target.value)} rows={4} />
              </div>
            </div>

            {/* Automation section */}
            <div className="border border-border rounded-lg p-3 space-y-4 bg-muted/20">
              <h3 className="text-sm font-display font-bold flex items-center gap-2 text-primary">
                <Settings2 className="w-4 h-4" /> Inställningar för automatisering
              </h3>

              {/* Activity level */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Aktivitetsnivå: <span className="text-foreground font-bold">{bot.activity_level}%</span>
                  <span className="ml-2 text-muted-foreground/70">
                    ({bot.activity_level <= 20 ? "Sällan" : bot.activity_level <= 50 ? "Ibland" : bot.activity_level <= 80 ? "Ofta" : "Väldigt ofta"})
                  </span>
                </label>
                <Slider value={[bot.activity_level]} onValueChange={v => updateBotField(bot.id, "activity_level", v[0])} max={100} step={1} />
              </div>

              {/* Allowed contexts */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Sammanhang (var får boten skriva?)</label>
                <div className="flex flex-col gap-2">
                  {CONTEXT_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={bot.allowed_contexts.includes(opt.value)}
                        onCheckedChange={() => toggleContext(bot.id, opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Cron interval */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tidsintervall (hur ofta körs automatiseringen?)</label>
                <Select value={bot.cron_interval} onValueChange={v => updateBotField(bot.id, "cron_interval", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRON_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => updateBot(bot)} disabled={saving === bot.id}>
                {saving === bot.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                Spara
              </Button>
              <Button size="sm" variant="outline" onClick={() => testBot(bot, "chat_reply")} disabled={testing === bot.id}>
                <MessageCircle className="w-3 h-3 mr-1" />Testa chatt
              </Button>
              <Button size="sm" variant="outline" onClick={() => testBot(bot, "guestbook_post")} disabled={testing === bot.id}>
                <BookOpen className="w-3 h-3 mr-1" />Testa gästbok
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteBot(bot.id)}>
                <Trash2 className="w-3 h-3 mr-1" />Ta bort
              </Button>
            </div>

            {testResult && (
              <div className="bg-muted/50 border border-border rounded p-3 text-sm">
                <span className="text-xs text-muted-foreground">Testsvar:</span>
                <p className="mt-1">{testResult}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
