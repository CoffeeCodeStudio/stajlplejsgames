import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, UserPlus } from "lucide-react";
import { z } from "zod";

const createUserSchema = z.object({
  username: z.string().trim().min(2, { message: "Namn måste vara minst 2 tecken" }).max(50),
  email: z.string().trim().email({ message: "Ogiltig e-postadress" }),
  password: z.string().min(6, { message: "Lösenord måste vara minst 6 tecken" }),
});

interface AdminCreateUserProps {
  onUserCreated: () => void;
}

export function AdminCreateUser({ onUserCreated }: AdminCreateUserProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const { toast } = useToast();

  const validateForm = () => {
    const result = createUserSchema.safeParse({ username, email, password });
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "create_user", email, password, username },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Användare skapad!",
        description: `${username} kan nu logga in med ${email} (godkänd direkt)`,
      });
      setUsername("");
      setEmail("");
      setPassword("");
      onUserCreated();
    } catch (err: any) {
      const msg = err.message || "Kunde inte skapa användare";
      toast({
        title: msg.includes("already") ? "E-post redan registrerad" : "Fel",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nostalgia-card p-6 max-w-md">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-primary" />
        Skapa ny användare
      </h2>

      <form onSubmit={handleCreateUser} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Namn</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="username" placeholder="Vännens namn" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10" disabled={isLoading} />
          </div>
          {errors.username && <p className="text-destructive text-sm">{errors.username}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="van@email.se" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" disabled={isLoading} />
          </div>
          {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Lösenord</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" disabled={isLoading} />
          </div>
          {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Skapar...</>
          ) : (
            <><UserPlus className="w-4 h-4 mr-2" />Skapa användare</>
          )}
        </Button>
      </form>
    </div>
  );
}
