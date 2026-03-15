import { useState } from "react";
import { ChevronDown, Shield, Heart, MessageCircle, Ban, AlertTriangle, Sparkles, Sun, Lock, Bot, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const communityRules = [
  {
    icon: Sun,
    title: "Positiv energi",
    description: "Echo2000 är en plats för glädje, oavsett bakgrund. Personliga påhopp och drama hör inte hemma här. Spara gnället för privatchatten.",
  },
  {
    icon: Heart,
    title: "Respektera varandra",
    description: "Behandla andra som du själv vill bli behandlad. Vi är alla här för att ha kul och umgås.",
  },
  {
    icon: MessageCircle,
    title: "Svordomar är okej – i lagom dos",
    description: "Vi är inga helgon här. Ett och annat kraftuttryck går bra, men överdriv inte. Använd sunt förnuft.",
  },
  {
    icon: Ban,
    title: "Nolltolerans mot mobbning",
    description: "Trakasserier, hot och systematisk mobbning leder till permanent avstängning. Inga undantag.",
  },
  {
    icon: AlertTriangle,
    title: "Inget olagligt innehåll",
    description: "Pornografi, droger, våld mot barn eller andra olagligheter är strikt förbjudet.",
  },
  {
    icon: Shield,
    title: "Skydda din integritet",
    description: "Dela inte personlig info som adress eller telefonnummer öppet. Var smart online.",
  },
  {
    icon: Sparkles,
    title: "Ha kul!",
    description: "Det här är en nostalgisk gemenskap. Njut av vibben, träffa nya människor och minns de goda tiderna.",
  },
];

const faqItems: FAQItem[] = [
  {
    question: "Vad är Echo2000?",
    answer: "Echo2000 är en nostalgisk community inspirerad av de klassiska sociala nätverken från 00-talet som LunarStorm och MSN. Här kan du chatta, blogga, skriva i gästböcker och träffa nya vänner – precis som förr i tiden!",
  },
  {
    question: "Är det gratis att använda?",
    answer: "Ja! Grundfunktionerna är helt gratis. Vi kan komma att erbjuda VIP-funktioner i framtiden för den som vill stötta communityn.",
  },
  {
    question: "Får man svära?",
    answer: "Ja, vi är inga pryder här. Ett \"fan\" eller \"jävlar\" går utmärkt. Men om varje mening innehåller en svordom så drar vi ner på det. Tänk dig att du pratar med kompisar – inte att du skriker på en fotbollsmatch.",
  },
  {
    question: "Vad händer om jag bryter mot reglerna?",
    answer: "Beroende på hur allvarligt det är kan du få en varning, tillfällig avstängning eller permanent ban. Mobbning och olagligt innehåll = direkt ban utan förvarning.",
  },
  {
    question: "Hur anmäler jag någon?",
    answer: "Klicka på de tre prickarna vid ett inlägg eller profil och välj \"Anmäl\". Beskriv kort vad som hänt så kollar vi på det. Anonymt, självklart.",
  },
  {
    question: "Kan jag radera mitt konto?",
    answer: "Absolut. Gå till Profil → Inställningar → Radera konto. All din data försvinner permanent inom 24 timmar.",
  },
  {
    question: "Hur gammal måste man vara?",
    answer: "Echo2000 är primärt anpassad för personer 25 år och uppåt. Vi är en nostalgisk community för de som faktiskt minns 00-talet! Undantag kan göras för yngre användare som kommer via verifierade kontakter – men det är ovanligt.",
  },
  {
    question: "Vad är Lajv?",
    answer: "Lajv är vår live-funktion där du kan skicka meddelanden som alla ser i realtid. Meddelandena försvinner automatiskt efter 10 minuter – perfekt för spontana tankar och snabba hälsningar!",
  },
  {
    question: "Varför ser det ut som 2005?",
    answer: "För att 2005 var fucking awesome. MSN-ljud, pixlade avatarer, gästböcker... Vi saknade det, så vi byggde det igen. Nostalgi på riktigt.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="container px-4 py-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl mb-2">
            Regler & FAQ
          </h1>
          <p className="text-muted-foreground">
            Allt du behöver veta om Echo2000
          </p>
        </div>

        {/* Community Rules */}
        <section className="mb-10">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Community-regler
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {communityRules.map((rule, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <rule.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{rule.title}</h3>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TL;DR Box */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-lg p-4">
            <h3 className="font-display font-bold text-sm mb-2 text-primary">
              TL;DR – Sammanfattning
            </h3>
            <p className="text-sm text-foreground/80">
              Var schysst, svär lagom, mobba inte, och ha kul. Bryter du mot reglerna 
              så åker du ut. Enkelt som det.
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section>
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-accent" />
            Vanliga frågor
          </h2>
          <div className="space-y-2">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-sm pr-4">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform",
                      openIndex === index && "rotate-180"
                    )}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Integritetspolicy */}
        <section className="mb-10">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Integritetspolicy
          </h2>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Vad vi samlar in:</strong> Användarnamn, e-postadress och den profildata du själv väljer att fylla i (stad, ålder, intressen m.m.).</p>
            <p><strong className="text-foreground">Lagring:</strong> All data lagras säkert via vår molntjänst med kryptering.</p>
            <p><strong className="text-foreground">Radering:</strong> Du kan när som helst begära radering av ditt konto och all tillhörande data via Profil → Inställningar → Radera konto, eller genom att kontakta oss.</p>
            <p><strong className="text-foreground">Cookies:</strong> Vi använder nödvändiga cookies för att hålla dig inloggad och förbättra upplevelsen. Inga tredjepartscookies för reklam.</p>
            <p><strong className="text-foreground">Kontakt för datarättigheter:</strong>{" "}
              <a href="mailto:support@echo2000.se" className="text-primary hover:underline">support@echo2000.se</a>
            </p>
          </div>
        </section>

        {/* AI-profiler & bottar */}
        <section className="mb-10">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI-profiler &amp; bottar
          </h2>
          <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              Echo2000 använder AI-genererade profiler under uppbyggnadsfasen för att skapa community-känsla. 
              Detta är en vanlig och accepterad metod för nya communities och är helt transparent. 
              AI-profiler är markerade internt och kommer gradvis att fasas ut i takt med att communityn växer.
            </p>
          </div>
        </section>

        {/* Ansvarsfriskrivning */}
        <section className="mb-10">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-primary" />
            Ansvarsfriskrivning
          </h2>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-sm text-muted-foreground">
            <p>Echo2000 är <strong className="text-foreground">inte</strong> anslutet till, sponsrat av eller affilierat med LunarStorm, Microsoft, MSN eller något annat företag. Alla varumärken tillhör sina respektive ägare.</p>
            <p>Echo2000 är i <strong className="text-destructive">alpha-fas</strong> och kan innehålla buggar, ofärdiga funktioner och oväntade ändringar. Data kan komma att återställas under utvecklingsperioden.</p>
            <p>Plattformen förbehåller sig rätten att moderera och ta bort innehåll som bryter mot community-reglerna utan föregående varning.</p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-10 text-center">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-display font-bold text-sm mb-2">
              Hittar du inte svaret?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Skicka ett mejl till oss så svarar vi så fort vi kan.
            </p>
            <a
              href="mailto:support@echo2000.se"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
            >
              support@echo2000.se
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 pb-4 text-center text-xs text-muted-foreground space-y-2">
          <p>
            <a href="/villkor" className="text-primary hover:underline">Användarvillkor</a>
          </p>
          <p>© 2026 Echo2000 Alpha</p>
        </footer>
      </div>
    </div>
  );
}
