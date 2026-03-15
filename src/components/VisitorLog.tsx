import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface Visitor {
  id: string;
  username: string;
  avatar_url: string | null;
  visited_at: string;
}

interface VisitorLogProps {
  visitors: Visitor[];
  className?: string;
}

function formatVisitTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return `Idag kl ${format(date, 'HH:mm')}`;
  }
  if (isYesterday(date)) {
    return `Igår kl ${format(date, 'HH:mm')}`;
  }
  return format(date, "d MMM 'kl' HH:mm", { locale: sv });
}

/**
 * Shows the most recent profile visitors — only visible to the profile owner.
 */
export function VisitorLog({ visitors, className }: VisitorLogProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
          Senaste besökare
        </h3>
      </div>

      {visitors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Inga besökare ännu — dela din profil!
        </p>
      ) : (
        <div className="space-y-1">
          {visitors.slice(0, 10).map((visitor) => (
            <div
              key={visitor.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => navigate(`/profile/${encodeURIComponent(visitor.username)}`)}
            >
              <Avatar
                name={visitor.username}
                src={visitor.avatar_url || undefined}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block group-hover:text-primary transition-colors">
                  {visitor.username}
                </span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatVisitTime(visitor.visited_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
