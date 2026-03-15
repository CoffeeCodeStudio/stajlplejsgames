import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileFieldProps {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  options?: string[];
  isText?: boolean;
  onChange: (value: string) => void;
}

/**
 * A single profile detail row that renders either a read-only value or an
 * inline editor (text input or select dropdown) depending on `isEditing`.
 */
export function ProfileField({
  label,
  value,
  editValue,
  isEditing,
  options,
  isText,
  onChange,
}: ProfileFieldProps) {
  return (
    <div className="flex gap-1">
      <span className="text-muted-foreground whitespace-nowrap">{label}</span>
      {isEditing ? (
        isText ? (
          <Input
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 text-xs px-1 flex-1 min-w-0"
            placeholder="..."
          />
        ) : (
          <Select value={editValue || ""} onValueChange={onChange}>
            <SelectTrigger className="h-6 text-xs px-1 flex-1 min-w-0">
              <SelectValue placeholder="Välj..." />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      ) : (
        <span className="text-primary truncate">{value || "Ej angivet"}</span>
      )}
    </div>
  );
}
