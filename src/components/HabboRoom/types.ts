export type AvatarAction = 'idle' | 'sit' | 'wave' | 'dance';

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
}

export interface Position {
  x: number;
  y: number;
}

export type FurnitureType = 'chair' | 'table' | 'plant' | 'lamp' | 'sofa' | 'bookshelf';

export interface Furniture {
  id: string;
  type: FurnitureType;
  position: Position;
  canSit?: boolean;
  label: string;
}

