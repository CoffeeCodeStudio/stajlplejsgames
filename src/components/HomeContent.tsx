/**
 * @module HomeContent
 * Main home page layout – thin render shell.
 * Shows HeroLanding for guests, 2026 Bento dashboard for logged-in users.
 */
import "./retro-crt.css";
import "./home/hero-landing.css";
import { useAuth } from "@/hooks/useAuth";
import { HeroLanding } from "./home/HeroLanding";
import { NewsFeed } from "./social/NewsFeed";
import { HomeStatsBox } from "./home/HomeStatsBox";
import { HomeVisionBox } from "./home/HomeVisionBox";
import { HomeSocialBox } from "./home/HomeSocialBox";
import { HomeRecentOnline } from "./home/HomeRecentOnline";
import { HomeLajvBox } from "./home/HomeLajvBox";
import { HomeDjBox } from "./home/HomeDjBox";
import { ClearViewToggle } from "./home/ClearViewToggle";
import { CrtBackground } from "./CrtBackground";

export function HomeContent() {
  const { user, loading } = useAuth();

  if (loading) return null;

  /* ── Guest view: clean hero ── */
  if (!user) return <HeroLanding />;

  /* ── Logged-in view: 2026 Bento Dashboard ── */
  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <CrtBackground>
        {/* Hero header */}
        <section className="py-3 md:py-4 text-center px-4">
          <h1 className="font-display font-bold text-xl sm:text-2xl md:text-3xl leading-tight text-glow mb-1">
            <span className="text-primary animate-kinetic-slide-up">Echo</span>
            <span className="text-accent animate-kinetic-slide-up" style={{ animationDelay: "0.1s" }}>2000</span>
          </h1>
          <p
            className="text-muted-foreground text-[10px] sm:text-xs max-w-lg mx-auto leading-snug"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}
          >
            En nostalgisk chatt-community inspirerad av MSN Messenger, LunarStorm och Playahead.
          </p>
          {/* Clear View toggle */}
          <div className="flex justify-center mt-2">
            <ClearViewToggle />
          </div>
        </section>

        {/* Stats + Vision — wide cards */}
        <section className="px-3 sm:px-4 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--bento-gap)] items-stretch">
            <HomeStatsBox />
            <HomeVisionBox />
          </div>
        </section>

        {/* Bento grid */}
        <section className="px-3 sm:px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--bento-gap)] auto-rows-fr">
            <div className="sm:col-span-2 lg:col-span-1">
              <HomeRecentOnline />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <NewsFeed />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-[var(--bento-gap)]">
              <HomeSocialBox />
              <HomeLajvBox />
              <HomeDjBox />
            </div>
          </div>
        </section>
      </CrtBackground>
    </div>
  );
}
