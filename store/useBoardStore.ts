import { create } from 'zustand';
import { Project, Board, Card, Connector } from '../types';

interface AppState {
  projects: Record<string, Project>;
  boards: Record<string, Board>;
  cards: Record<string, Card>;
  connectors: Record<string, Connector>;

  // Legacy data migration function
  migrateLegacyData: (oldData: any[]) => void;
  initializeEmpty: () => void;

  // Actions
  addProject: (name: string) => Project;
  deleteProject: (id: string) => void;
  
  addBoard: (projectId: string, name: string) => Board;
  deleteBoard: (id: string) => void;

  addCard: (card: Card) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
}

export const useBoardStore = create<AppState>((set) => ({
  projects: {},
  boards: {},
  cards: {},
  connectors: {},

  migrateLegacyData: (oldProjects: any[]) => {
    set((state) => {
      const newProjects: Record<string, Project> = {};
      const newBoards: Record<string, Board> = {};
      const newCards: Record<string, Card> = {};

      oldProjects.forEach(p => {
        newProjects[p.id] = { id: p.id, name: p.name, icon: p.icon || 'Box' };
        if (p.groups && Array.isArray(p.groups)) {
          p.groups.forEach((g: any) => {
            newBoards[g.id] = { id: g.id, projectId: p.id, name: g.name };
            if (g.items && Array.isArray(g.items)) {
              g.items.forEach((i: any) => {
                newCards[i.id] = {
                  id: i.id,
                  boardId: g.id,
                  label: i.label || '',
                  value: i.value || '',
                  type: i.type || 'text',
                  x: i.x || 0,
                  y: i.y || 0,
                  width: i.width,
                  height: i.height,
                  isNew: i.isNew,
                  parentId: i.parentId,
                  noteColor: i.noteColor
                };
              });
            }
          });
        }
      });

      return { projects: newProjects, boards: newBoards, cards: newCards, connectors: {} };
    });
  },

  initializeEmpty: () => set({ projects: {}, boards: {}, cards: {}, connectors: {} }),

  addProject: (name: string) => {
    const newProject: Project = { id: crypto.randomUUID(), name, icon: 'Box' };
    set(state => ({
      projects: { ...state.projects, [newProject.id]: newProject }
    }));
    return newProject;
  },

  deleteProject: (id: string) => {
    set(state => {
      const nextProjects = { ...state.projects };
      delete nextProjects[id];
      // Also delete associated boards and cards
      const nextBoards = { ...state.boards };
      const nextCards = { ...state.cards };
      Object.values(state.boards).forEach(b => {
        if (b.projectId === id) {
          delete nextBoards[b.id];
          Object.values(state.cards).forEach(c => {
            if (c.boardId === b.id) delete nextCards[c.id];
          });
        }
      });
      return { projects: nextProjects, boards: nextBoards, cards: nextCards };
    });
  },

  addBoard: (projectId: string, name: string) => {
    const newBoard: Board = { id: crypto.randomUUID(), projectId, name };
    set(state => ({
      boards: { ...state.boards, [newBoard.id]: newBoard }
    }));
    return newBoard;
  },

  deleteBoard: (id: string) => {
    set(state => {
      const nextBoards = { ...state.boards };
      delete nextBoards[id];
      const nextCards = { ...state.cards };
      Object.values(state.cards).forEach(c => {
        if (c.boardId === id) delete nextCards[c.id];
      });
      return { boards: nextBoards, cards: nextCards };
    });
  },

  addCard: (card: Card) => {
    set(state => ({
      cards: { ...state.cards, [card.id]: card }
    }));
  },

  updateCard: (id: string, updates: Partial<Card>) => {
    set(state => {
      if (!state.cards[id]) return state;
      return {
        cards: {
          ...state.cards,
          [id]: { ...state.cards[id], ...updates }
        }
      };
    });
  },

  deleteCard: (id: string) => {
    set(state => {
      const nextCards = { ...state.cards };
      delete nextCards[id];
      // Note: we can also cascade delete if it has children in mindmap
      return { cards: nextCards };
    });
  }
}));
