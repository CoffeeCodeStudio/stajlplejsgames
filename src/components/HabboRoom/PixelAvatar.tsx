
import { AvatarAction } from './types';

interface PixelAvatarProps {
  action: AvatarAction;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({ action }) => {
  const getAnimationClass = () => {
    switch (action) {
      case 'wave':
        return 'animate-pixel-wave';
      case 'dance':
        return 'animate-pixel-dance';
      case 'sit':
        return 'pixel-sit';
      default:
        return 'animate-pixel-idle';
    }
  };

  return (
    <div className={`pixel-avatar ${getAnimationClass()}`}>
      {/* Pixel art avatar - 16x24 grid representation */}
      <svg 
        width="48" 
        height="72" 
        viewBox="0 0 16 24" 
        style={{ imageRendering: 'pixelated' }}
        className="drop-shadow-lg"
      >
        {/* Hair */}
        <rect x="4" y="0" width="8" height="1" fill="#4a3728" />
        <rect x="3" y="1" width="10" height="1" fill="#4a3728" />
        <rect x="3" y="2" width="10" height="2" fill="#5c4a3a" />
        
        {/* Face */}
        <rect x="4" y="4" width="8" height="1" fill="#f5d6b8" />
        <rect x="3" y="5" width="10" height="4" fill="#f5d6b8" />
        
        {/* Eyes */}
        <rect x="5" y="5" width="2" height="2" fill="#2a2a3a" />
        <rect x="9" y="5" width="2" height="2" fill="#2a2a3a" />
        <rect x="5" y="5" width="1" height="1" fill="#ffffff" />
        <rect x="9" y="5" width="1" height="1" fill="#ffffff" />
        
        {/* Mouth */}
        <rect x="6" y="7" width="4" height="1" fill="#d4a69a" />
        
        {/* Neck */}
        <rect x="6" y="9" width="4" height="1" fill="#f5d6b8" />
        
        {/* Shirt */}
        <rect x="3" y="10" width="10" height="1" fill="#4a90d9" />
        <rect x="2" y="11" width="12" height="5" fill="#4a90d9" />
        <rect x="2" y="11" width="1" height="4" fill="#3a7bc4" />
        <rect x="13" y="11" width="1" height="4" fill="#3a7bc4" />
        
        {/* Arms */}
        {action === 'wave' ? (
          <>
            {/* Left arm normal */}
            <rect x="1" y="11" width="1" height="4" fill="#f5d6b8" />
            {/* Right arm raised */}
            <rect x="14" y="8" width="1" height="3" fill="#f5d6b8" />
            <rect x="14" y="7" width="2" height="2" fill="#f5d6b8" />
          </>
        ) : (
          <>
            <rect x="1" y="11" width="1" height="4" fill="#f5d6b8" />
            <rect x="14" y="11" width="1" height="4" fill="#f5d6b8" />
          </>
        )}
        
        {/* Pants */}
        <rect x="4" y="16" width="8" height="1" fill="#3a5a8a" />
        <rect x="4" y="17" width="3" height="3" fill="#3a5a8a" />
        <rect x="9" y="17" width="3" height="3" fill="#3a5a8a" />
        
        {/* Legs - adjusted for sitting */}
        {action === 'sit' ? (
          <>
            <rect x="4" y="20" width="3" height="2" fill="#3a5a8a" />
            <rect x="9" y="20" width="3" height="2" fill="#3a5a8a" />
            <rect x="4" y="22" width="3" height="2" fill="#2a2a2a" />
            <rect x="9" y="22" width="3" height="2" fill="#2a2a2a" />
          </>
        ) : (
          <>
            <rect x="4" y="20" width="3" height="2" fill="#2a2a2a" />
            <rect x="9" y="20" width="3" height="2" fill="#2a2a2a" />
            <rect x="4" y="22" width="3" height="2" fill="#1a1a1a" />
            <rect x="9" y="22" width="3" height="2" fill="#1a1a1a" />
          </>
        )}
      </svg>
    </div>
  );
};
