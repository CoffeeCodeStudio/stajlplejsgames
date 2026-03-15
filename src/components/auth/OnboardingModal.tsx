import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { AvatarPicker, avatarOptions, type AvatarOption } from "../AvatarPicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Import avatars for gender defaults
import avatarBoyBlue from "@/assets/avatars/avatar-boy-blue.png";
import avatarGirlPink from "@/assets/avatars/avatar-girl-pink.png";
import avatarRobot from "@/assets/avatars/avatar-robot.png";

const genderOptions = [
  { value: "Kille", label: "Kille", emoji: "👦", defaultAvatar: avatarBoyBlue },
  { value: "Tjej", label: "Tjej", emoji: "👧", defaultAvatar: avatarGirlPink },
  { value: "Annat", label: "Annat", emoji: "🌈", defaultAvatar: avatarRobot },
];

const relationshipOptions = [
  "Singel",
  "Kär",
  "Sambo", 
  "Gift",
  "Letar",
  "Komplicerat",
];

const interestOptions = [
  { id: "musik", label: "Musik", emoji: "🎵" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "fest", label: "Fest", emoji: "🎉" },
  { id: "djur", label: "Djur", emoji: "🐾" },
  { id: "foto", label: "Foto", emoji: "📷" },
  { id: "traning", label: "Träning", emoji: "💪" },
  { id: "trance", label: "Trance", emoji: "🎧" },
  { id: "hiphop", label: "Hiphop", emoji: "🎤" },
];

const occupationOptions = ["Jobbar", "Pluggar", "Arbetssökande"];
const smokingOptions = ["Ja", "Nej", "Fest"];

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

export function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [relationship, setRelationship] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [occupation, setOccupation] = useState("");
  const [smoking, setSmoking] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isStep1Valid = gender && city && age;
  const totalSteps = 3;

  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender);
    const genderOption = genderOptions.find(g => g.value === selectedGender);
    if (genderOption && !avatarUrl) {
      setAvatarUrl(genderOption.defaultAvatar);
    }
  };

  const toggleInterest = (interestId: string) => {
    setInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleSubmit = async () => {
    if (!isStep1Valid) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          gender,
          city,
          age: parseInt(age),
          avatar_url: avatarUrl,
          relationship,
          interests: interests.join(", "),
          occupation,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Profil sparad! 🎉",
        description: "Välkommen till Echo2000!",
      });
      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Fel",
        description: "Kunde inte spara profilen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleSkip}
    >
      <div
        className="nostalgia-card max-w-lg w-full p-6 my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Stäng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="font-display font-black text-2xl tracking-tight mb-2">
            <span className="text-foreground">ECHO</span>
            <span className="text-primary-foreground bg-primary px-2 rounded">2000</span>
          </div>
          <h1 className="font-bold text-lg mt-4">Välkommen! 🎉</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Steg {step} av {totalSteps}
          </p>
          {/* Progress bar */}
          <div className="flex gap-2 mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-2 rounded-full transition-colors",
                  i < step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Kön *</Label>
              <div className="grid grid-cols-3 gap-3">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleGenderSelect(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[100px]",
                      "hover:border-primary/50 hover:bg-primary/5",
                      gender === option.value
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-border"
                    )}
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <span className="font-semibold text-sm">{option.label}</span>
                    {gender === option.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Stad *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Din stad..."
                maxLength={100}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Ålder *</Label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Din ålder..."
                min={13}
                max={99}
                className="h-12 text-base"
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className="w-full h-12 text-base font-semibold"
            >
              Fortsätt →
            </Button>
          </div>
        )}

        {/* Step 2: Lifestyle */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Civilstånd</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option} value={option} className="text-base py-3">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Sysselsättning</Label>
              <div className="grid grid-cols-3 gap-2">
                {occupationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setOccupation(option)}
                    className={cn(
                      "py-3 px-4 rounded-lg border-2 font-medium transition-all",
                      occupation === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Röker du?</Label>
              <div className="grid grid-cols-3 gap-2">
                {smokingOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSmoking(option)}
                    className={cn(
                      "py-3 px-4 rounded-lg border-2 font-medium transition-all",
                      smoking === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12"
              >
                ← Tillbaka
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 h-12 text-base font-semibold"
              >
                Fortsätt →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Interests & Avatar */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Intressen</Label>
              <div className="grid grid-cols-2 gap-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={cn(
                      "flex items-center gap-2 py-3 px-4 rounded-lg border-2 font-medium transition-all text-left",
                      interests.includes(interest.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-xl">{interest.emoji}</span>
                    <span>{interest.label}</span>
                    {interests.includes(interest.id) && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Välj en avatar</Label>
              <AvatarPicker
                selectedAvatarId={avatarUrl ? avatarOptions.find(a => a.src === avatarUrl)?.id : undefined}
                onSelect={(avatar: AvatarOption) => setAvatarUrl(avatar.src)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-12"
              >
                ← Tillbaka
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 h-12 text-base font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  "Klar! 🚀"
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">* Obligatoriska fält</p>
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Hoppa över
          </button>
        </div>
      </div>
    </div>
  );
}
