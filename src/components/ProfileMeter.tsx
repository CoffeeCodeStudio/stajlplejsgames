import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

interface ProfileMeterProps {
  hasAvatar: boolean;
  friendsCount: number;
  guestbookCount: number;
  hasBio: boolean;
  className?: string;
}

/**
 * Profile completion meter (Koll-mätare)
 * Shows a progress bar based on profile completeness
 */
export function ProfileMeter({ 
  hasAvatar, 
  friendsCount, 
  guestbookCount, 
  hasBio,
  className 
}: ProfileMeterProps) {
  // Calculate score
  let score = 0;
  
  // Avatar: +20%
  if (hasAvatar) score += 20;
  
  // Bio: +15%
  if (hasBio) score += 15;
  
  // Friends: +5% per friend, max 30%
  score += Math.min(friendsCount * 5, 30);
  
  // Guestbook entries: +5% per entry, max 20%
  score += Math.min(guestbookCount * 5, 20);
  
  // Activity bonus (placeholder): +15%
  score += 15;
  
  // Cap at 100
  score = Math.min(score, 100);

  const getScoreColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Stjärnprofil! ⭐';
    if (score >= 50) return 'Bra start! 👍';
    return 'Fyll i mer! ✏️';
  };

  return (
    <div className={cn("p-3 bg-card rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Koll-mätare
        </span>
        <span className="text-sm font-bold text-primary">{score}%</span>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", getScoreColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-center text-muted-foreground">
        {getScoreLabel()}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className={hasAvatar ? 'text-green-500' : 'text-muted-foreground'}>
            {hasAvatar ? '✓' : '○'}
          </span>
          Profilbild (+20%)
        </div>
        <div className="flex items-center gap-1">
          <span className={hasBio ? 'text-green-500' : 'text-muted-foreground'}>
            {hasBio ? '✓' : '○'}
          </span>
          Bio (+15%)
        </div>
        <div className="flex items-center gap-1">
          <span className={friendsCount > 0 ? 'text-green-500' : 'text-muted-foreground'}>
            {friendsCount > 0 ? '✓' : '○'}
          </span>
          Vänner ({friendsCount})
        </div>
        <div className="flex items-center gap-1">
          <span className={guestbookCount > 0 ? 'text-green-500' : 'text-muted-foreground'}>
            {guestbookCount > 0 ? '✓' : '○'}
          </span>
          Gästbok ({guestbookCount})
        </div>
      </div>
    </div>
  );
}
