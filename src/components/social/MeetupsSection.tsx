import { useState } from "react";
import { Calendar, MapPin, Users, Clock, Heart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";

interface Meetup {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  attendees: number;
  maxAttendees: number;
  host: {
    name: string;
    avatar?: string;
  };
  category: string;
  isInterested: boolean;
}

const demoMeetups: Meetup[] = [
  {
    id: "1",
    title: "Retro Gaming Kväll",
    description: "Vi spelar klassiska N64 och PS1-spel! Ta med dina favoriter.",
    date: "2024-02-15",
    time: "18:00",
    location: "Café Retro",
    city: "Stockholm",
    attendees: 12,
    maxAttendees: 20,
    host: { name: "Erik" },
    category: "Gaming",
    isInterested: false,
  },
  {
    id: "2",
    title: "2000-tals Nostalgi Fika",
    description: "Snacka om MSN, LunarStorm och allt vi saknar från 00-talet!",
    date: "2024-02-18",
    time: "14:00",
    location: "Espresso House",
    city: "Göteborg",
    attendees: 8,
    maxAttendees: 15,
    host: { name: "Lisa" },
    category: "Social",
    isInterested: true,
  },
  {
    id: "3",
    title: "Indie Musik Hangout",
    description: "Dela dina favoritlåtar och upptäck ny musik tillsammans.",
    date: "2024-02-20",
    time: "19:00",
    location: "Musikbaren",
    city: "Malmö",
    attendees: 5,
    maxAttendees: 12,
    host: { name: "Johan" },
    category: "Musik",
    isInterested: false,
  },
  {
    id: "4",
    title: "Brädspelskväll",
    description: "Klassiker som Monopol, Risk och Settlers of Catan!",
    date: "2024-02-22",
    time: "17:00",
    location: "Spelcaféet",
    city: "Uppsala",
    attendees: 6,
    maxAttendees: 8,
    host: { name: "Anna" },
    category: "Gaming",
    isInterested: false,
  },
];

const categories = ["Alla", "Gaming", "Social", "Musik"];
const cities = ["Alla städer", "Stockholm", "Göteborg", "Malmö", "Uppsala"];

export function MeetupsSection() {
  const [meetups, setMeetups] = useState(demoMeetups);
  const [activeCategory, setActiveCategory] = useState("Alla");
  const [activeCity, setActiveCity] = useState("Alla städer");
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);

  const filteredMeetups = meetups.filter((m) => {
    const categoryMatch = activeCategory === "Alla" || m.category === activeCategory;
    const cityMatch = activeCity === "Alla städer" || m.city === activeCity;
    return categoryMatch && cityMatch;
  });

  const toggleInterest = (id: string) => {
    setMeetups((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              isInterested: !m.isInterested,
              attendees: m.isInterested ? m.attendees - 1 : m.attendees + 1,
            }
          : m
      )
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sv-SE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">Träffar</h1>
              <p className="text-sm text-muted-foreground">Hitta och skapa IRL-event!</p>
            </div>
          </div>
          <Button className="font-display gap-2">
            <span className="text-lg">+</span> Skapa träff
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="font-display"
              >
                {cat}
              </Button>
            ))}
          </div>
          <select
            value={activeCity}
            onChange={(e) => setActiveCity(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-card font-display"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Meetup Detail Modal */}
        {selectedMeetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-card rounded-xl border-2 border-primary/30 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/20 rounded">
                      {selectedMeetup.category}
                    </span>
                    <h2 className="font-display font-bold text-xl mt-2">{selectedMeetup.title}</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMeetup(null)}>
                    ✕
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                <p className="text-muted-foreground">{selectedMeetup.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{formatDate(selectedMeetup.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{selectedMeetup.time}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>
                      {selectedMeetup.location}, {selectedMeetup.city}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar name={selectedMeetup.host.name} size="sm" />
                  <div>
                    <p className="text-xs text-muted-foreground">Arrangör</p>
                    <p className="font-semibold">{selectedMeetup.host.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {selectedMeetup.attendees}/{selectedMeetup.maxAttendees} deltagare
                    </span>
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(selectedMeetup.attendees / selectedMeetup.maxAttendees) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-border flex gap-3">
                <Button
                  variant={selectedMeetup.isInterested ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => {
                    toggleInterest(selectedMeetup.id);
                    setSelectedMeetup({
                      ...selectedMeetup,
                      isInterested: !selectedMeetup.isInterested,
                      attendees: selectedMeetup.isInterested
                        ? selectedMeetup.attendees - 1
                        : selectedMeetup.attendees + 1,
                    });
                  }}
                >
                  <Heart
                    className={cn("w-4 h-4", selectedMeetup.isInterested && "fill-current")}
                  />
                  {selectedMeetup.isInterested ? "Anmäld!" : "Jag kommer!"}
                </Button>
                <Button variant="ghost" onClick={() => setSelectedMeetup(null)}>
                  Stäng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Meetups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeetups.map((meetup) => (
            <button
              key={meetup.id}
              onClick={() => setSelectedMeetup(meetup)}
              className="group text-left p-4 rounded-xl border-2 border-border bg-card transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/20 rounded">
                    {meetup.category}
                  </span>
                  <h3 className="font-display font-bold text-lg mt-1 group-hover:text-primary transition-colors">
                    {meetup.title}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {meetup.description}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(meetup.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {meetup.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {meetup.city}
                </span>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={meetup.host.name} size="sm" />
                  <span className="text-xs text-muted-foreground">{meetup.host.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">
                    {meetup.attendees}/{meetup.maxAttendees}
                  </span>
                  {meetup.isInterested && (
                    <Heart className="w-3 h-3 text-primary fill-primary" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredMeetups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Inga träffar hittades med dessa filter.</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-display font-bold mb-2">🤝 Om Träffar</h3>
          <p className="text-sm text-muted-foreground">
            Här hittar du IRL-event skapade av communityn! Häng med på spelkvällar, 
            fika-träffar och andra nostalgi-event. Detta är en demo – snart kan du 
            skapa egna träffar!
          </p>
        </div>
      </div>
    </div>
  );
}
