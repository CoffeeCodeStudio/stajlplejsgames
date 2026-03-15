/** Select options for profile fields used in edit mode. */

export const occupationOptions = [
  "Student", "Högstadiet", "Gymnasiet", "Universitet", "Arbetssökande",
  "Anställd", "Egen företagare", "Frilansare", "Föräldraledig", "Pensionär", "Annat",
];

export const relationshipOptions = [
  "Singel", "Upptagen", "Helst utan", "I ett förhållande", "Förlovad",
  "Gift", "Det är komplicerat", "Öppet förhållande", "Vill inte säga",
];

export const personalityOptions = [
  "Självsäker", "Blyg", "Social", "Lugn", "Energisk", "Kreativ", "Analytisk", "Spontan",
];

export const hairColorOptions = [
  "Blond", "Ljusblondin", "Brunett", "Svart", "Röd", "Färgglada", "Grå", "Annat",
];

export const bodyTypeOptions = [
  "Smal", "Normal", "Atletisk", "Kurvig", "Medellång", "Annat",
];

export const lookingForOptions = [
  "Vänskap", "Chatt", "Dejting", "Nätverkande", "Gaming-kompisar", "Inget speciellt",
];

export const genderOptions = ["Kille", "Tjej", "Annat"];

/** Shape of profile data when in edit mode. */
export interface EditableProfileData {
  username: string;
  avatar_url: string | null;
  status_message: string;
  bio: string;
  city: string;
  occupation: string;
  relationship: string;
  personality: string;
  hair_color: string;
  body_type: string;
  clothing: string;
  likes: string;
  eats: string;
  listens_to: string;
  prefers: string;
  looking_for: string[];
  age: number | null;
  gender: string;
  interests: string;
  spanar_in: string;
}

/** Demo data shown to logged-out visitors. */
export const demoProfile: EditableProfileData = {
  username: "demo_alex",
  avatar_url: null,
  status_message: "Living in the 2000s 🦋",
  bio: "Hej! Jag är en demo-profil. Logga in för att skapa din egen profil och börja chatta med andra!",
  city: "Stockholm",
  occupation: "Student",
  relationship: "Singel",
  personality: "Social",
  hair_color: "Brunett",
  body_type: "Normal",
  clothing: "Casual",
  likes: "Musik, gaming, vänner",
  eats: "Pizza",
  listens_to: "Allt möjligt",
  prefers: "Hänga med kompisar",
  looking_for: ["Vänskap", "Chatt"],
  age: 22,
  gender: "Kille",
  interests: "Retro gaming, webbutveckling",
  spanar_in: "Nya vänner",
};

/** Helper to build an {@link EditableProfileData} from a profile row (or defaults). */
export function toEditableData(profile: Record<string, any> | null): EditableProfileData {
  return {
    username: profile?.username || "",
    avatar_url: profile?.avatar_url ?? null,
    status_message: profile?.status_message || "",
    bio: profile?.bio || "",
    city: profile?.city || "",
    occupation: profile?.occupation || "",
    relationship: profile?.relationship || "",
    personality: profile?.personality || "",
    hair_color: profile?.hair_color || "",
    body_type: profile?.body_type || "",
    clothing: profile?.clothing || "",
    likes: profile?.likes || "",
    eats: profile?.eats || "",
    listens_to: profile?.listens_to || "",
    prefers: profile?.prefers || "",
    looking_for: profile?.looking_for || [],
    age: profile?.age ?? null,
    gender: profile?.gender || "",
    interests: profile?.interests || "",
    spanar_in: profile?.spanar_in || "",
  };
}
