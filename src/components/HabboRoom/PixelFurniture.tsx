
import { Furniture, Position } from './types';

interface PixelFurnitureProps {
  furniture: Furniture;
  isSelected: boolean;
  onClick: () => void;
}

// SVG furniture components
const ChairSVG: React.FC = () => (
  <svg width="32" height="40" viewBox="0 0 16 20" style={{ imageRendering: 'pixelated' }}>
    {/* Chair back */}
    <rect x="2" y="0" width="12" height="2" fill="#8b4513" />
    <rect x="2" y="2" width="2" height="10" fill="#a0522d" />
    <rect x="12" y="2" width="2" height="10" fill="#8b4513" />
    <rect x="4" y="2" width="8" height="2" fill="#cd853f" />
    <rect x="4" y="4" width="8" height="2" fill="#deb887" />
    {/* Chair seat */}
    <rect x="1" y="10" width="14" height="3" fill="#a0522d" />
    <rect x="2" y="11" width="12" height="1" fill="#cd853f" />
    {/* Chair legs */}
    <rect x="2" y="13" width="2" height="7" fill="#8b4513" />
    <rect x="12" y="13" width="2" height="7" fill="#8b4513" />
  </svg>
);

const TableSVG: React.FC = () => (
  <svg width="48" height="32" viewBox="0 0 24 16" style={{ imageRendering: 'pixelated' }}>
    {/* Table top */}
    <rect x="0" y="0" width="24" height="3" fill="#8b4513" />
    <rect x="1" y="1" width="22" height="1" fill="#a0522d" />
    {/* Table legs */}
    <rect x="2" y="3" width="2" height="13" fill="#6b3a0f" />
    <rect x="20" y="3" width="2" height="13" fill="#6b3a0f" />
    {/* Table decoration - coffee cup */}
    <rect x="10" y="-2" width="4" height="3" fill="#ffffff" />
    <rect x="14" y="-1" width="2" height="1" fill="#ffffff" />
  </svg>
);

const PlantSVG: React.FC = () => (
  <svg width="28" height="44" viewBox="0 0 14 22" style={{ imageRendering: 'pixelated' }}>
    {/* Pot */}
    <rect x="3" y="14" width="8" height="8" fill="#cd5c5c" />
    <rect x="2" y="14" width="10" height="2" fill="#bc4a4a" />
    <rect x="4" y="20" width="6" height="2" fill="#8b3a3a" />
    {/* Leaves */}
    <rect x="6" y="4" width="2" height="12" fill="#228b22" />
    <rect x="2" y="2" width="4" height="6" fill="#32cd32" />
    <rect x="8" y="0" width="4" height="8" fill="#2e8b2e" />
    <rect x="0" y="6" width="4" height="4" fill="#228b22" />
    <rect x="10" y="4" width="4" height="4" fill="#32cd32" />
    <rect x="4" y="0" width="3" height="4" fill="#3cb371" />
  </svg>
);

const LampSVG: React.FC = () => (
  <svg width="24" height="48" viewBox="0 0 12 24" style={{ imageRendering: 'pixelated' }}>
    {/* Lampshade */}
    <polygon points="2,0 10,0 12,8 0,8" fill="#ffd700" />
    <polygon points="3,1 9,1 10,7 2,7" fill="#ffec8b" />
    {/* Pole */}
    <rect x="5" y="8" width="2" height="12" fill="#c0c0c0" />
    {/* Base */}
    <rect x="2" y="20" width="8" height="2" fill="#808080" />
    <rect x="3" y="22" width="6" height="2" fill="#696969" />
    {/* Light glow effect */}
    <ellipse cx="6" cy="10" rx="8" ry="4" fill="#ffd700" opacity="0.2" />
  </svg>
);

const SofaSVG: React.FC = () => (
  <svg width="64" height="40" viewBox="0 0 32 20" style={{ imageRendering: 'pixelated' }}>
    {/* Sofa back */}
    <rect x="0" y="0" width="32" height="8" fill="#4a4a8a" />
    <rect x="1" y="1" width="30" height="6" fill="#5a5a9a" />
    {/* Armrests */}
    <rect x="0" y="6" width="4" height="10" fill="#3a3a6a" />
    <rect x="28" y="6" width="4" height="10" fill="#3a3a6a" />
    {/* Seat cushions */}
    <rect x="4" y="8" width="24" height="6" fill="#6a6aaa" />
    <rect x="5" y="9" width="10" height="4" fill="#7a7aba" />
    <rect x="17" y="9" width="10" height="4" fill="#7a7aba" />
    {/* Legs */}
    <rect x="2" y="16" width="3" height="4" fill="#2a2a4a" />
    <rect x="27" y="16" width="3" height="4" fill="#2a2a4a" />
  </svg>
);

const BookshelfSVG: React.FC = () => (
  <svg width="40" height="56" viewBox="0 0 20 28" style={{ imageRendering: 'pixelated' }}>
    {/* Frame */}
    <rect x="0" y="0" width="20" height="28" fill="#8b4513" />
    <rect x="1" y="1" width="18" height="26" fill="#a0522d" />
    {/* Shelves */}
    <rect x="1" y="9" width="18" height="2" fill="#8b4513" />
    <rect x="1" y="18" width="18" height="2" fill="#8b4513" />
    {/* Books top shelf */}
    <rect x="2" y="2" width="3" height="7" fill="#cd5c5c" />
    <rect x="5" y="3" width="2" height="6" fill="#4169e1" />
    <rect x="7" y="2" width="4" height="7" fill="#228b22" />
    <rect x="11" y="4" width="3" height="5" fill="#ffd700" />
    <rect x="14" y="2" width="4" height="7" fill="#9932cc" />
    {/* Books middle shelf */}
    <rect x="2" y="11" width="4" height="7" fill="#ff6347" />
    <rect x="6" y="12" width="3" height="6" fill="#20b2aa" />
    <rect x="9" y="11" width="2" height="7" fill="#dda0dd" />
    <rect x="12" y="13" width="3" height="5" fill="#f0e68c" />
    <rect x="15" y="11" width="3" height="7" fill="#87ceeb" />
    {/* Books bottom shelf */}
    <rect x="3" y="20" width="5" height="6" fill="#b8860b" />
    <rect x="8" y="21" width="4" height="5" fill="#dc143c" />
    <rect x="12" y="20" width="3" height="6" fill="#00ced1" />
  </svg>
);

export const PixelFurniture: React.FC<PixelFurnitureProps> = ({ furniture, isSelected, onClick }) => {
  const renderFurniture = () => {
    switch (furniture.type) {
      case 'chair':
        return <ChairSVG />;
      case 'table':
        return <TableSVG />;
      case 'plant':
        return <PlantSVG />;
      case 'lamp':
        return <LampSVG />;
      case 'sofa':
        return <SofaSVG />;
      case 'bookshelf':
        return <BookshelfSVG />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`pixel-furniture ${isSelected ? 'pixel-furniture-selected' : ''} ${furniture.canSit ? 'pixel-furniture-sittable' : ''}`}
      style={{
        position: 'absolute',
        left: `${furniture.position.x}%`,
        top: `${furniture.position.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: furniture.canSit ? 'pointer' : 'default',
      }}
      onClick={onClick}
      title={furniture.label}
    >
      {renderFurniture()}
      {isSelected && (
        <div className="furniture-label">{furniture.label}</div>
      )}
    </div>
  );
};
