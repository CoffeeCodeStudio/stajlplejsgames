import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Info, AlertTriangle, X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenord måste vara minst 6 tecken" }),
});

const usernameRegex = /^[a-zA-Z0-9_\-.\[\]()*åäöÅÄÖ]+$/;

const registerSchema = z.object({
  username: z.string().trim()
    .min(2, { message: "Namn måste vara minst 2 tecken" })
    .max(50)
    .regex(usernameRegex, { message: "Tillåtna tecken: bokstäver, siffror, _ - . [ ] ( ) *" }),
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenord måste vara minst 6 tecken" }),
});

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const schema = mode === "login" ? loginSchema : registerSchema;
    const data = mode === "login" ? { email, password } : { username, email, password };
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: { username?: string; email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (mode === "register" && (!acceptedRules || !confirmedAge || !acceptedTerms)) {
      toast({
        title: "Fyll i alla fält",
        description: "Du måste bekräfta din ålder, godkänna villkoren och reglerna för att skapa ett konto.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (!error.message.includes("Invalid login credentials")) {
            toast({ title: "Fel", description: error.message, variant: "destructive" });
          } else {
            toast({ title: "Inloggning misslyckades", description: "Fel e-post eller lösenord", variant: "destructive" });
          }
        } else {
          const { data: { user: loggedInUser } } = await supabase.auth.getUser();
          if (loggedInUser) {
            const { data: isBanned } = await supabase.rpc('has_role', { _user_id: loggedInUser.id, _role: 'banned' });
            if (isBanned) {
              await supabase.auth.signOut();
              toast({ title: "Kontot är avstängt", description: "Ditt konto har blivit bannlyst.", variant: "destructive" });
              return;
            }
            const { data: profile } = await supabase
              .from("profiles")
              .select("is_approved")
              .eq("user_id", loggedInUser.id)
              .single();
            if (profile && !(profile as any).is_approved) {
              await supabase.auth.signOut();
              toast({
                title: "Väntar på godkännande",
                description: "Ditt konto väntar på att godkännas av en administratör. Du får logga in när kontot är godkänt.",
                variant: "destructive",
                duration: 8000,
              });
              return;
            }
          }
          toast({ title: "Välkommen tillbaka!", description: "Du är nu inloggad" });
        }
      } else {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", username)
          .maybeSingle();

        if (existingUser) {
          toast({ title: "Registrering misslyckades", description: "Användarnamnet är redan taget.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const { data, error } = await signUp(email, password, username);
        if (error) {
          toast({ title: "Registrering misslyckades", description: error.message, variant: "destructive" });
        } else if (data.user) {
          // Auto-confirmed: assign role, then sign out so admin gate works
          await supabase.from("user_roles").insert({ user_id: data.user.id, role: "user" as any });
          await supabase.auth.signOut();
          toast({
            title: "Konto skapat! 🎉",
            description: "Ditt konto väntar på godkännande av en administratör. Du kan logga in när kontot är godkänt.",
            duration: 10000,
          });
          setMode("login");
          setUsername("");
          setEmail("");
          setPassword("");
          setAcceptedRules(false);
          setConfirmedAge(false);
          setAcceptedTerms(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 right-4 z-[60] p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Stäng"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md mx-4 relative">
        <div className="text-center mb-6">
          <div className="font-display font-black text-3xl tracking-tight mb-2">
            <span className="text-foreground">ECHO</span>
            <span className="text-accent-foreground bg-accent px-2 rounded">2000</span>
          </div>
          <p className="text-muted-foreground text-sm">Nostalgi på riktigt</p>
        </div>

        <div className="bg-card border-2 border-border p-6 shadow-[4px_4px_0px_hsl(var(--border))]">
          {mode !== "forgot" && (
            <div className="flex mb-6 border-b-2 border-border">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 -mb-[2px] ${
                  mode === "login" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Logga in
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 -mb-[2px] ${
                  mode === "register" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Registrera
              </button>
            </div>
          )}

          {mode === "register" && (
            <div className="mb-4 p-3 bg-destructive/10 border-2 border-destructive/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-destructive">
                    OBS: Detta är en ALPHA-version.
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">
                    Sidan är under aktiv utveckling. Funktioner kan ändras och data kan återställas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode !== "forgot" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="username">Användarnamn</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Ditt namn"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && <p className="text-destructive text-sm">{errors.username}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="din@email.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 border border-border">
                    <Checkbox
                      id="age"
                      checked={confirmedAge}
                      onCheckedChange={(checked) => setConfirmedAge(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="age" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                      Jag bekräftar att jag är minst 25 år gammal
                    </label>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 border border-border">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                      Jag har läst och godkänner{" "}
                      <a
                        href="/villkor"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        användarvillkoren
                      </a>
                    </label>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 border border-border">
                    <Checkbox
                      id="rules"
                      checked={acceptedRules}
                      onCheckedChange={(checked) => setAcceptedRules(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="rules" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                      Jag godkänner reglerna och förstår att sidan är i <span className="font-bold text-destructive">Alpha</span>.
                    </label>
                  </div>
                </div>
              )}

              {mode === "register" && (
                <p className="text-center text-xs text-muted-foreground italic py-1">
                  Endast för oss som minns 56k-modem och brända CD-skivor 💿
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || (mode === "register" && (!acceptedRules || !confirmedAge || !acceptedTerms))}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === "login" ? "Loggar in..." : "Registrerar..."}
                  </>
                ) : (
                  mode === "login" ? "Logga in" : "Skapa konto"
                )}
              </Button>
            </form>
          )}

          {mode === "login" && (
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm text-primary hover:underline w-full text-center"
              >
                Glömt lösenord?
              </button>
              <div className="p-3 bg-muted/50 border border-border">
                <div className="flex items-start gap-2 text-sm">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    Ny här? Klicka på "Registrera" ovan för att skapa ett konto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mt-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotLoading(true);
                  const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  setForgotLoading(false);
                  if (error) {
                    toast({ title: "Fel", description: error.message, variant: "destructive" });
                  } else {
                    toast({ title: "Skickat!", description: "Kolla din e-post för en återställningslänk." });
                    setMode("login");
                    setForgotEmail("");
                  }
                }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Din e-postadress</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="din@email.se"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10"
                      disabled={forgotLoading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={forgotLoading || !forgotEmail.trim()}>
                  {forgotLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Skickar...</> : "Skicka återställningslänk"}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-muted-foreground hover:text-primary mt-3 w-full text-center"
              >
                ← Tillbaka till inloggning
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Tillbaka till startsidan
          </button>
        </div>
      </div>
    </div>
  );
}
