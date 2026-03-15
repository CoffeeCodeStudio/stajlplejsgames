
import { Furniture, Position } from './types';
import { PixelFurniture } from './PixelFurniture';

interface IsometricRoomProps {
  children: React.ReactNode;
  furniture: Furniture[];
  avatarPosition: Position;
  selectedFurnitureId: string | null;
  onFurnitureClick: (furniture: Furniture) => void;
}

export const IsometricRoom: React.FC<IsometricRoomProps> = ({ 
  children, 
  furniture, 
  avatarPosition,
  selectedFurnitureId,
  onFurnitureClick 
}) => {
  return (
    <div className="isometric-room-container">
      <svg 
        viewBox="0 0 400 300" 
        className="w-full h-full max-w-[600px] max-h-[450px]"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Back wall - left side */}
        <polygon 
          points="50,50 200,120 200,220 50,150" 
          fill="#5588bb"
          stroke="#4477aa"
          strokeWidth="2"
        />
        {/* Wall pattern - left */}
        <line x1="80" y1="60" x2="80" y2="140" stroke="#6699cc" strokeWidth="1" />
        <line x1="110" y1="70" x2="110" y2="155" stroke="#6699cc" strokeWidth="1" />
        <line x1="140" y1="82" x2="140" y2="170" stroke="#6699cc" strokeWidth="1" />
        <line x1="170" y1="95" x2="170" y2="185" stroke="#6699cc" strokeWidth="1" />
        
        {/* Back wall - right side */}
        <polygon 
          points="200,120 350,50 350,150 200,220" 
          fill="#4477aa"
          stroke="#3366aa"
          strokeWidth="2"
        />
        {/* Wall pattern - right */}
        <line x1="230" y1="105" x2="230" y2="195" stroke="#5588bb" strokeWidth="1" />
        <line x1="260" y1="92" x2="260" y2="180" stroke="#5588bb" strokeWidth="1" />
        <line x1="290" y1="78" x2="290" y2="165" stroke="#5588bb" strokeWidth="1" />
        <line x1="320" y1="64" x2="320" y2="152" stroke="#5588bb" strokeWidth="1" />
        
        {/* Window on left wall */}
        <rect x="100" y="80" width="40" height="50" fill="#87ceeb" stroke="#334455" strokeWidth="2" />
        <line x1="120" y1="80" x2="120" y2="130" stroke="#334455" strokeWidth="2" />
        <line x1="100" y1="105" x2="140" y2="105" stroke="#334455" strokeWidth="2" />
        
        {/* Poster on right wall */}
        <rect x="260" y="70" width="30" height="40" fill="#2a2a4a" stroke="#1a1a3a" strokeWidth="1" />
        <rect x="263" y="73" width="24" height="34" fill="#3a3a5a" />
        <text x="275" y="92" fill="#ffd700" fontSize="6" textAnchor="middle" fontFamily="monospace">E2K</text>
        
        {/* Floor - isometric wooden planks */}
        <polygon 
          points="50,150 200,220 350,150 200,280" 
          fill="#8b6914"
          stroke="#6b4904"
          strokeWidth="2"
        />
        
        {/* Floor wood grain pattern */}
        <line x1="80" y1="160" x2="200" y2="230" stroke="#7a5a12" strokeWidth="1" />
        <line x1="110" y1="155" x2="200" y2="210" stroke="#7a5a12" strokeWidth="1" />
        <line x1="140" y1="152" x2="200" y2="190" stroke="#7a5a12" strokeWidth="1" />
        <line x1="170" y1="150" x2="200" y2="170" stroke="#7a5a12" strokeWidth="1" />
        
        <line x1="230" y1="165" x2="200" y2="230" stroke="#9a7924" strokeWidth="1" />
        <line x1="260" y1="158" x2="200" y2="215" stroke="#9a7924" strokeWidth="1" />
        <line x1="290" y1="153" x2="200" y2="195" stroke="#9a7924" strokeWidth="1" />
        <line x1="320" y1="151" x2="200" y2="175" stroke="#9a7924" strokeWidth="1" />
        
        {/* Floor shadow/depth lines */}
        <line x1="200" y1="220" x2="200" y2="280" stroke="#5a4004" strokeWidth="2" />
        
        {/* Small rug in center */}
        <ellipse cx="200" cy="240" rx="50" ry="18" fill="#8b2252" opacity="0.8" />
        <ellipse cx="200" cy="240" rx="40" ry="14" fill="#cd5c5c" opacity="0.9" />
        <ellipse cx="200" cy="240" rx="25" ry="8" fill="#e07070" opacity="0.7" />
      </svg>
      
      {/* Furniture layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full">
          {furniture.map(item => (
            <div key={item.id} className="pointer-events-auto">
              <PixelFurniture
                furniture={item}
                isSelected={selectedFurnitureId === item.id}
                onClick={() => onFurnitureClick(item)}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Avatar overlay - positioned based on avatarPosition */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div 
          className="pointer-events-auto relative transition-all duration-500 ease-out"
          style={{ 
            transform: `translate(${(avatarPosition.x - 50) * 2}px, ${(avatarPosition.y - 50) * 1.5}px)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
