/**
 * @module ProfileBasicInfo
 * Inline display/edit for gender, age, city, status, spanar_in, and activity.
 */
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StatusIndicator, type UserStatus } from "@/components/StatusIndicator";
import { genderOptions, type EditableProfileData } from "./profile-constants";

interface ProfileBasicInfoProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
  userStatus: UserStatus;
  userActivity?: string;
  lastSeen: string | null;
}

export function ProfileBasicInfo({
  displayData, editData, setEditData, isEditing, userStatus, userActivity, lastSeen,
}: ProfileBasicInfoProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-foreground">
          {isEditing ? (
            <div className="flex gap-2 items-center flex-wrap">
              <Select value={editData.gender || ""} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
                <SelectTrigger className="w-24 h-7 text-xs"><SelectValue placeholder="Kön" /></SelectTrigger>
                <SelectContent>
                  {genderOptions.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input
                value={editData.age?.toString() || ""}
                onChange={(e) => setEditData({ ...editData, age: e.target.value ? parseInt(e.target.value) : null })}
                className="w-16 h-7 text-xs" type="number" placeholder="Ålder"
              />
              <span className="text-sm">år från</span>
              <Input
                value={editData.city}
                onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                className="w-28 h-7 text-xs" placeholder="Stad"
              />
            </div>
          ) : (
            <span className="text-sm">
              {displayData.gender || "Ej angivet"}, {displayData.age || "?"} år från{" "}
              <span className="text-primary font-medium">{displayData.city || "Okänt"}</span>
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <StatusIndicator status={userStatus} size="sm" />
        <span className={cn(
          "text-xs uppercase font-medium",
          userStatus === "online" && "text-[hsl(var(--online-green))]",
          userStatus === "away" && "text-yellow-500",
          userStatus === "offline" && "text-muted-foreground"
        )}>
          {userStatus === "online" ? "ONLINE" : userStatus === "away" ? "BORTA" : "OFFLINE"}
        </span>
        <span className="text-xs text-muted-foreground">
          - spanar in{" "}
          {isEditing ? (
            <Input value={editData.spanar_in} onChange={(e) => setEditData({ ...editData, spanar_in: e.target.value })} className="inline-block w-24 h-5 text-xs px-1" placeholder="..." />
          ) : (
            <span className="text-primary">{displayData.spanar_in || "..."}</span>
          )}
        </span>
      </div>
      {userStatus !== "offline" && userActivity && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-muted-foreground">🎮 Just nu:</span>
          <span className="text-xs text-primary font-medium">{userActivity}</span>
        </div>
      )}
      {userStatus === "offline" && lastSeen && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-muted-foreground">🕐 Senast inloggad:</span>
          <span className="text-xs text-muted-foreground">{lastSeen}</span>
        </div>
      )}
    </div>
  );
}
