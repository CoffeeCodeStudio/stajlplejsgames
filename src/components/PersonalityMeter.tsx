import { cn } from "@/lib/utils";
import { VOTE_CATEGORIES, type VoteCategory, type VoteCounts, type UserVotes } from "@/hooks/useFriendVotes";

interface PersonalityMeterProps {
  voteCounts: VoteCounts;
  userVotes: UserVotes;
  totalVotes: number;
  onToggleVote: (category: VoteCategory) => void;
  disabled?: boolean;
  loading?: boolean;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Bäst': '🏆',
  'Nörd': '🤓',
  'Cooling': '😎',
  'Hård som sten': '🪨',
  'Festis': '🎉',
  'Ball': '⚽',
  'Tuffing': '💪',
};

export function PersonalityMeter({
  voteCounts,
  userVotes,
  totalVotes,
  onToggleVote,
  disabled = false,
  loading = false,
}: PersonalityMeterProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Vad tycker vännerna?
      </p>
      {VOTE_CATEGORIES.map((category) => {
        const count = voteCounts[category] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const hasVoted = userVotes[category] || false;

        return (
          <button
            key={category}
            onClick={() => onToggleVote(category)}
            disabled={disabled || loading}
            className={cn(
              "w-full flex items-center gap-2 group transition-all rounded-md px-2 py-1.5 text-left",
              "hover:bg-muted/50",
              hasVoted && "bg-primary/10",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-sm w-5 text-center">{CATEGORY_EMOJIS[category]}</span>
            <span className={cn(
              "text-xs font-medium w-24 truncate",
              hasVoted ? "text-primary" : "text-foreground"
            )}>
              {category}
            </span>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  hasVoted
                    ? "bg-gradient-to-r from-primary to-primary/70"
                    : "bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-10 text-right font-mono">
              {percentage}%
            </span>
          </button>
        );
      })}
      {totalVotes > 0 && (
        <p className="text-[10px] text-muted-foreground text-right mt-1">
          {totalVotes} röst{totalVotes !== 1 ? 'er' : ''} totalt
        </p>
      )}
    </div>
  );
}
