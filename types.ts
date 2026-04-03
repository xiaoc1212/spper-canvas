export type ItemType = 'text' | 'password' | 'code' | 'image' | 'note' | 'mindmap' | 'link';

export interface SecretItem {
  id: string;
  label: string;
  value: string;
  type: ItemType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isNew?: boolean;
  parentId?: string;
  noteColor?: number;
}

export interface ProjectGroup {
  id: string;
  name: string;
  items: SecretItem[];
}

export interface Project {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  groups: ProjectGroup[];
}

// Just for props and state management
export type ViewMode = 'desktop' | 'mobile_nav';
