export type ItemType = 'text' | 'password' | 'code' | 'image' | 'note' | 'mindmap' | 'link';

export interface Card {
  id: string;
  boardId: string; // Foreign key linking back to its Board
  label: string;
  value: string;
  type: ItemType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  isNew?: boolean;
  parentId?: string; // used for mindmap connections
  noteColor?: number;
}

export interface Connector {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface Board {
  id: string;
  projectId: string; // Foreign key linking back to Project
  name: string;
}

export interface Project {
  id: string;
  name: string;
  icon: string;
}

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

// Just for props and state management
export type ViewMode = 'desktop' | 'mobile_nav';
