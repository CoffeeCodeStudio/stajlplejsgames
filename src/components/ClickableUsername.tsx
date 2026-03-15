import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';

interface ClickableUsernameProps {
  username: string;
  avatarUrl?: string | null;
  userId?: string;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  nameClassName?: string;
}

/**
 * Clickable username component that navigates to user's profile
 * Can optionally show avatar next to name
 */
export function ClickableUsername({
  username,
  avatarUrl,
  userId,
  showAvatar = false,
  avatarSize = 'sm',
  className,
  nameClassName,
}: ClickableUsernameProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (username) {
      navigate(`/profile/${encodeURIComponent(username)}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity',
        className
      )}
    >
      {showAvatar && (
        <Avatar
          name={username}
          src={avatarUrl || undefined}
          size={avatarSize}
        />
      )}
      <span
        className={cn(
          'text-primary hover:underline cursor-pointer font-medium',
          nameClassName
        )}
      >
        {username}
      </span>
    </button>
  );
}
