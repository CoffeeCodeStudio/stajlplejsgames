/**
 * @module HeroLanding
 * 2026 Premium Nostalgia hero for logged-out users.
 * Kinetic typography, glassmorphism pills, refined CTA.
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { Snowfall } from "./Snowfall";

/* ── types ── */
interface MemberAvatar {
  id: string;
  username: string;
  avatar_url: string | null;
}

/* ── avatar with initial-letter fallback ── */
function MemberBubble({ member, index }: { member: MemberAvatar; index: number }) {
  const initial = member.username.charAt(0).toUpperCase();
  const hasAvatar = !!member.avatar_url;
  const delay = `${index * 0.08}s`;

  const baseClass =
    "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary/50 animate-kinetic-slide-up";

  return hasAvatar ? (
    <img
      src={member.avatar_url!}
      alt={member.username}
      title={member.username}
      className={`${baseClass} object-cover bg-muted`}
      style={{ animationDelay: delay }}
      loading="lazy"
    />
  ) : (
    <div
      title={member.username}
      className={`${baseClass} bg-primary/15 flex items-center justify-center text-primary font-bold text-sm sm:text-base`}
      style={{ animationDelay: delay }}
    >
      {initial}
    </div>
  );
}

/* ── skeleton while loading ── */
function SocialProofSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 mt-10 animate-pulse">
      <div className="flex -space-x-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/30 border-2 border-border"
          />
        ))}
      </div>
      <div className="h-4 w-48 rounded-full bg-muted/20" />
    </div>
  );
}

/* ── social proof row ── */
function SocialProof({ members, loading }: { members: MemberAvatar[]; loading: boolean }) {
  if (loading) return <SocialProofSkeleton />;
  if (members.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 mt-10">
      <div className="flex -space-x-3">
        {members.map((m, i) => (
          <MemberBubble key={m.id} member={m} index={i} />
        ))}
      </div>
      <p className="text-muted-foreground text-sm flex items-center gap-1.5">
        <Users className="w-4 h-4" />
        <span>
          <strong className="text-foreground">{members.length}+</strong> medlemmar har redan gått med
        </span>
      </p>
    </div>
  );
}

/* ── vision pills ── */
const visionItems = [
  { emoji: "💬", text: "MSN-chatt" },
  { emoji: "🎮", text: "Retro-spel" },
  { emoji: "🎨", text: "Klotterplank" },
  { emoji: "❤️", text: "Gemenskap" },
];

/* ── main component ── */
export function HeroLanding() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberAvatar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(8);
        if (data) setMembers(data);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      {/* Deep space gradient background */}
      <div
        className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 sm:py-24 relative"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, hsl(265 35% 15% / 0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, hsl(28 100% 56% / 0.06) 0%, transparent 50%)",
        }}
      >
        {/* Snowfall layers */}
        <Snowfall />

        {/* Kinetic headline */}
        <h1 className="font-display font-bold text-center max-w-4xl">
          <span
            className="kinetic-text block text-3xl sm:text-5xl md:text-7xl text-foreground animate-kinetic-slide-up"
            style={{ lineHeight: 1.1, letterSpacing: "-0.03em" }}
          >
            Välkommen hem till
          </span>
          <span className="block mt-1 sm:mt-2">
            <span
              className="kinetic-text text-4xl sm:text-6xl md:text-8xl text-primary animate-kinetic-blur-in"
              style={{ animationDelay: "0.2s", lineHeight: 1.1 }}
            >
              2000
            </span>
            <span
              className="kinetic-text text-4xl sm:text-6xl md:text-8xl text-accent animate-kinetic-blur-in"
              style={{ animationDelay: "0.35s", lineHeight: 1.1 }}
            >
              -talet
            </span>
          </span>
        </h1>

        <p
          className="mt-5 sm:mt-8 text-muted-foreground text-base sm:text-lg md:text-xl text-center max-w-2xl animate-kinetic-slide-up"
          style={{ lineHeight: 1.65, letterSpacing: "0.3px", animationDelay: "0.3s" }}
        >
          En nostalgisk community inspirerad av MSN&nbsp;Messenger, LunarStorm
          och Playahead — fast med dagens teknik.
        </p>

        {/* Glassmorphism vision pills */}
        <div
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-7 animate-kinetic-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          {visionItems.map((v) => (
            <span
              key={v.text}
              className="pressable inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-foreground select-none"
              style={{
                background: "hsl(var(--glass-bg))",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid hsl(var(--glass-border))",
              }}
            >
              <span aria-hidden="true">{v.emoji}</span> {v.text}
            </span>
          ))}
        </div>

        {/* CTA — pressable micro-interaction */}
        <button
          onClick={() => navigate("/auth")}
          className="hero-cta-button pressable mt-10 sm:mt-12 px-10 sm:px-14 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background min-h-[52px] animate-kinetic-slide-up"
          style={{ animationDelay: "0.5s" }}
        >
          Skapa din profil
        </button>

        <button
          onClick={() => navigate("/auth")}
          className="pressable mt-4 text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 min-h-[44px] flex items-center animate-kinetic-slide-up"
          style={{ animationDelay: "0.55s" }}
        >
          Har du redan konto? Logga in
        </button>

        {/* Social proof */}
        <SocialProof members={members} loading={loading} />
      </div>
    </div>
  );
}
