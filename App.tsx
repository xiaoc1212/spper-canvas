import React, { useState, useEffect } from 'react';
import { SidebarProjects } from './components/SidebarProjects';
import { SidebarGroups } from './components/SidebarGroups';
import { ContentArea } from './components/ContentArea';
import { useBoardStore } from './store/useBoardStore';
import { INITIAL_DATA } from './constants';
import { Menu, X } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'config-vault-data-v2';
const LEGACY_STORAGE_KEY = 'config-vault-data-v1';

export default function App() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { projects, boards, addProject, deleteProject, addBoard, deleteBoard, migrateLegacyData } = useBoardStore();
  const projectsList = Object.values(projects);
  const boardsList = Object.values(boards);

  const cardsMap = useBoardStore(state => state.cards);

  // Load Data
  useEffect(() => {
    const savedV2 = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedV2 && savedV2 !== 'undefined' && savedV2 !== 'null') {
      try {
        useBoardStore.setState(JSON.parse(savedV2));
      } catch (e) {
        console.error("Failed to parse saved v2 data", e);
      }
    } else {
      const savedV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedV1 && savedV1 !== 'undefined' && savedV1 !== 'null') {
        try {
          const oldData = JSON.parse(savedV1);
          migrateLegacyData(oldData);
        } catch (e) {
          console.error("Failed to migrate v1 data", e);
          migrateLegacyData(INITIAL_DATA as any);
        }
      } else {
        migrateLegacyData(INITIAL_DATA as any);
      }
    }
    setInitialized(true);
  }, [migrateLegacyData]);

  // Save Data
  useEffect(() => {
    if (initialized) {
      const state = useBoardStore.getState();
      const saveState = { projects: state.projects, boards: state.boards, cards: state.cards, connectors: state.connectors };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveState));
    }
  }, [projects, boards, cardsMap, initialized]);

  // Auto-select first project
  useEffect(() => {
    if (initialized && projectsList.length > 0 && !activeProjectId) {
      setActiveProjectId(projectsList[0].id);
    }
  }, [initialized, projectsList, activeProjectId]);

  // Auto-select first board in project
  useEffect(() => {
    if (!activeProjectId) return;
    const projectBoards = boardsList.filter(b => b.projectId === activeProjectId);
    
    // If the currently active board doesn't belong to this project, switch it
    const activeBoardBelongsToProject = activeBoardId && projectBoards.some(b => b.id === activeBoardId);
    
    if (projectBoards.length > 0 && (!activeBoardId || !activeBoardBelongsToProject)) {
      setActiveBoardId(projectBoards[0].id);
    } else if (projectBoards.length === 0) {
      setActiveBoardId(null);
    }
  }, [activeProjectId, boardsList, activeBoardId]);

  if (!initialized) return <div className="h-screen w-full bg-background flex items-center justify-center text-gray-500">Loading Configuration...</div>;

  const activeProject = activeProjectId ? projects[activeProjectId] : null;
  const activeBoard = activeBoardId ? boards[activeBoardId] : null;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background text-slate-200 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface">
        <span className="font-bold text-lg">超级画板 - Milanote</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
           {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Main Layout Area */}
      <div className={`
        fixed inset-0 z-40 bg-background md:relative md:flex md:w-auto
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0 pt-16' : '-translate-x-full pt-0'}
        md:translate-x-0 md:pt-0
        flex flex-col md:flex-row
      `}>
          <SidebarProjects 
            projects={projectsList} 
            activeProjectId={activeProjectId} 
            onSelectProject={(id) => { setActiveProjectId(id); if(window.innerWidth < 768) setMobileMenuOpen(false); }}
            onAddProject={addProject}
            onDeleteProject={deleteProject}
          />

          <SidebarGroups 
            activeProject={activeProject}
            projectBoards={boardsList.filter(b => b.projectId === activeProjectId)}
            activeBoardId={activeBoardId}
            onSelectGroup={(id) => { setActiveBoardId(id); if(window.innerWidth < 768) setMobileMenuOpen(false); }}
            onAddGroup={(name) => { if(activeProjectId) addBoard(activeProjectId, name); }}
            onDeleteGroup={(id) => deleteBoard(id)}
          />
      </div>

      {/* Content Area */}
      <div className="flex-1 h-full overflow-hidden relative z-0">
          <ContentArea 
            activeBoard={activeBoard} 
          />
      </div>
    </div>
  );
}
