import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

// Gästbok - liten figur med bok
export function GuestbookIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
      fill="none"
    >
      {/* Huvud */}
      <circle cx="12" cy="6" r="4" fill="currentColor" />
      {/* Kropp */}
      <rect x="9" y="10" width="6" height="6" rx="1" fill="currentColor" />
      {/* Bok */}
      <rect x="6" y="11" width="4" height="5" rx="0.5" fill="currentColor" opacity="0.7" />
      <line x1="8" y1="12" x2="8" y2="15" stroke="white" strokeWidth="0.5" />
      {/* Ben */}
      <rect x="9" y="16" width="2" height="3" fill="currentColor" />
      <rect x="13" y="16" width="2" height="3" fill="currentColor" />
      {/* Fötter */}
      <ellipse cx="10" cy="20" rx="2" ry="1" fill="currentColor" />
      <ellipse cx="14" cy="20" rx="2" ry="1" fill="currentColor" />
    </svg>
  );
}

// Mejl - liten figur med kuvert
export function MailIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
      fill="none"
    >
      {/* Huvud */}
      <circle cx="12" cy="6" r="4" fill="currentColor" />
      {/* Kropp */}
      <rect x="9" y="10" width="6" height="6" rx="1" fill="currentColor" />
      {/* Kuvert */}
      <rect x="14" y="9" width="6" height="4" rx="0.5" fill="currentColor" opacity="0.8" />
      <path d="M14 9 L17 11.5 L20 9" stroke="white" strokeWidth="0.7" fill="none" />
      {/* Ben */}
      <rect x="9" y="16" width="2" height="3" fill="currentColor" />
      <rect x="13" y="16" width="2" height="3" fill="currentColor" />
      {/* Fötter */}
      <ellipse cx="10" cy="20" rx="2" ry="1" fill="currentColor" />
      <ellipse cx="14" cy="20" rx="2" ry="1" fill="currentColor" />
    </svg>
  );
}

// Chatt - liten figur med pratbubbla
export function ChatIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
      fill="none"
    >
      {/* Pratbubbla */}
      <path 
        d="M15 3 H20 Q22 3 22 5 V9 Q22 11 20 11 H17 L15 13 V11 H15 Q13 11 13 9 V5 Q13 3 15 3" 
        fill="currentColor" 
        opacity="0.7"
      />
      <circle cx="16" cy="7" r="0.5" fill="white" />
      <circle cx="18" cy="7" r="0.5" fill="white" />
      <circle cx="20" cy="7" r="0.5" fill="white" />
      {/* Huvud */}
      <circle cx="10" cy="8" r="4" fill="currentColor" />
      {/* Kropp */}
      <rect x="7" y="12" width="6" height="5" rx="1" fill="currentColor" />
      {/* Ben */}
      <rect x="7" y="17" width="2" height="3" fill="currentColor" />
      <rect x="11" y="17" width="2" height="3" fill="currentColor" />
      {/* Fötter */}
      <ellipse cx="8" cy="21" rx="2" ry="1" fill="currentColor" />
      <ellipse cx="12" cy="21" rx="2" ry="1" fill="currentColor" />
    </svg>
  );
}

// Vänner - två små figurer
export function FriendsIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
      fill="none"
    >
      {/* Figur 1 */}
      <circle cx="7" cy="6" r="3" fill="currentColor" />
      <rect x="5" y="9" width="4" height="4" rx="0.5" fill="currentColor" />
      <rect x="5" y="13" width="1.5" height="3" fill="currentColor" />
      <rect x="7.5" y="13" width="1.5" height="3" fill="currentColor" />
      <ellipse cx="5.75" cy="16.5" rx="1.5" ry="0.75" fill="currentColor" />
      <ellipse cx="8.25" cy="16.5" rx="1.5" ry="0.75" fill="currentColor" />
      
      {/* Figur 2 */}
      <circle cx="17" cy="6" r="3" fill="currentColor" />
      <rect x="15" y="9" width="4" height="4" rx="0.5" fill="currentColor" />
      <rect x="15" y="13" width="1.5" height="3" fill="currentColor" />
      <rect x="17.5" y="13" width="1.5" height="3" fill="currentColor" />
      <ellipse cx="15.75" cy="16.5" rx="1.5" ry="0.75" fill="currentColor" />
      <ellipse cx="18.25" cy="16.5" rx="1.5" ry="0.75" fill="currentColor" />
      
      {/* Hjärta mellan */}
      <path 
        d="M12 10 L11 9 Q10 8 11 7 Q12 6 12 7.5 Q12 6 13 7 Q14 8 13 9 Z" 
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

// Profil - ensam figur med stjärna
export function ProfileIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
      fill="none"
    >
      {/* Stjärna */}
      <path 
        d="M18 4 L18.5 5.5 L20 6 L18.5 6.5 L18 8 L17.5 6.5 L16 6 L17.5 5.5 Z" 
        fill="currentColor"
        opacity="0.7"
      />
      {/* Huvud */}
      <circle cx="12" cy="7" r="4" fill="currentColor" />
      {/* Kropp */}
      <rect x="9" y="11" width="6" height="5" rx="1" fill="currentColor" />
      {/* Ben */}
      <rect x="9" y="16" width="2" height="3" fill="currentColor" />
      <rect x="13" y="16" width="2" height="3" fill="currentColor" />
      {/* Fötter */}
      <ellipse cx="10" cy="20" rx="2" ry="1" fill="currentColor" />
      <ellipse cx="14" cy="20" rx="2" ry="1" fill="currentColor" />
    </svg>
  );
}

// Hem/Start - figur med hus
export function HomeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
      fill="none"
    >
      {/* Hus */}
      <path d="M3 10 L8 5 L13 10 V16 H3 V10 Z" fill="currentColor" opacity="0.6" />
      <rect x="6" y="12" width="2" height="4" fill="white" opacity="0.5" />
      <path d="M2 10 L8 4 L14 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      
      {/* Figur */}
      <circle cx="17" cy="8" r="3" fill="currentColor" />
      <rect x="15" y="11" width="4" height="4" rx="0.5" fill="currentColor" />
      <rect x="15" y="15" width="1.5" height="3" fill="currentColor" />
      <rect x="17.5" y="15" width="1.5" height="3" fill="currentColor" />
      <ellipse cx="15.75" cy="18.5" rx="1.5" ry="0.75" fill="currentColor" />
      <ellipse cx="18.25" cy="18.5" rx="1.5" ry="0.75" fill="currentColor" />
    </svg>
  );
}

// Lajv - figur med radiovågor (live)
export function LajvIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("text-current", className)}
      fill="none"
    >
      {/* Radiovågor */}
      <path 
        d="M18 4 Q22 8 18 12" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
        opacity="0.5"
      />
      <path 
        d="M16 6 Q18 8 16 10" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
        opacity="0.7"
      />
      {/* Pulsande prick */}
      <circle cx="14" cy="8" r="2" fill="currentColor" />
      
      {/* Figur */}
      <circle cx="8" cy="8" r="3.5" fill="currentColor" />
      <rect x="5.5" y="11.5" width="5" height="4.5" rx="0.75" fill="currentColor" />
      <rect x="5.5" y="16" width="2" height="3" fill="currentColor" />
      <rect x="8.5" y="16" width="2" height="3" fill="currentColor" />
      <ellipse cx="6.5" cy="19.5" rx="1.75" ry="0.75" fill="currentColor" />
      <ellipse cx="9.5" cy="19.5" rx="1.75" ry="0.75" fill="currentColor" />
    </svg>
  );
}
