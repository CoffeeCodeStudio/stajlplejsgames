

interface VibeWalletProps {
  vibesRemaining: number;
  totalVibes: number;
}

export const VibeWallet: React.FC<VibeWalletProps> = ({ vibesRemaining, totalVibes }) => {
  return (
    <div className="vibe-wallet">
      {/* Pixel wallet icon */}
      <svg 
        width="20" 
        height="16" 
        viewBox="0 0 10 8" 
        style={{ imageRendering: 'pixelated' }}
        className="vibe-wallet-icon"
      >
        <rect x="0" y="1" width="9" height="6" fill="#8b6914" />
        <rect x="1" y="2" width="7" height="4" fill="#a67c00" />
        <rect x="7" y="3" width="3" height="2" fill="#ffd700" />
        <rect x="8" y="3" width="1" height="2" fill="#ffec8b" />
      </svg>
      <span className="vibe-wallet-text">
        {vibesRemaining}/{totalVibes}
      </span>
    </div>
  );
};
