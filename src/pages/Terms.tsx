import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>

        <h1 className="font-display text-2xl font-bold text-foreground mb-6">📜 Användarvillkor — ECHO2000</h1>

        <div className="text-sm text-muted-foreground space-y-4">
          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">1. Allmänt</p>
            <p>ECHO2000 är en community i Alpha-fas. Genom att skapa ett konto godkänner du dessa villkor i sin helhet.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">2. Ålderskrav</p>
            <p>Du måste vara minst <strong>25 år gammal</strong> för att registrera dig och använda tjänsten.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">3. Uppförande</p>
            <p>Positiv energi är ett krav. Negativitet, personangrepp och delande av personliga problem i publika utrymmen är förbjudet. Måttligt svärande är tillåtet.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">4. Olagligt innehåll</p>
            <p>Alla former av <strong>olagligt innehåll</strong> — inklusive men inte begränsat till hot, trakasserier, hatpropaganda, barnpornografi och upphovsrättsintrång — leder till <strong>omedelbar avstängning och permanent radering</strong> av kontot. Vi förbehåller oss rätten att anmäla till berörda myndigheter.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">5. Innehåll & ansvar</p>
            <p>Du ansvarar för allt innehåll du publicerar. Vi förbehåller oss rätten att ta bort innehåll som bryter mot reglerna utan förvarning.</p>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">6. Personuppgifter & GDPR</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Vi sparar nödvändig data (e-postadress, IP-adress, profiluppgifter) för att tjänsten ska fungera.</li>
              <li>Din data delas <strong>inte</strong> med tredje part i marknadsföringssyfte.</li>
              <li>Du kan när som helst begära <strong>radering av ditt konto och all tillhörande data</strong> via inställningarna eller genom att kontakta oss.</li>
              <li>Du har rätt att begära ett utdrag av dina personuppgifter.</li>
            </ul>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">7. Alpha-status & ansvarsfrihet</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Sidan är under aktiv utveckling. Funktioner kan ändras och data kan återställas <strong>utan förvarning</strong>.</li>
              <li>Vi ansvarar <strong>inte</strong> för tekniska fel, driftstopp eller förlust av data under Alpha-perioden.</li>
              <li>Genom att använda tjänsten accepterar du att den tillhandahålls <strong>"as is"</strong> utan garantier.</li>
            </ul>
          </div>

          <div className="p-3 bg-muted/40 border border-border">
            <p className="font-bold text-foreground mb-1">8. Konton</p>
            <p>Nya konton kräver godkännande av en administratör. Vi kan stänga av eller radera konton som bryter mot dessa villkor.</p>
          </div>

          <p className="text-xs text-muted-foreground/70 text-center pt-2">
            Senast uppdaterad: mars 2026 · © 2026 Echo2000 Alpha
          </p>
        </div>
      </div>
    </div>
  );
}
