import React, { useState, useEffect } from 'react';
import { SidebarProjects } from './components/SidebarProjects';
import { SidebarGroups } from './components/SidebarGroups';
import { ContentArea } from './components/ContentArea';
import { Project, ProjectGroup, SecretItem } from './types';
import { INITIAL_DATA } from './constants';
import { Menu, X } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'config-vault-data-v1';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // Mobile nav state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && saved !== 'undefined' && saved !== 'null') {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data", e);
        setProjects(INITIAL_DATA);
      }
    } else {
      setProjects(INITIAL_DATA);
    }
  }, []);

  // Save Data
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  // Set initial active states if data exists and nothing selected
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  useEffect(() => {
    const activeProj = projects.find(p => p.id === activeProjectId);
    if (activeProj && activeProj.groups.length > 0 && !activeGroupId) {
      setActiveGroupId(activeProj.groups[0].id);
    } else if (activeProj && activeProj.groups.length === 0) {
        setActiveGroupId(null);
    }
  }, [activeProjectId, projects]); // Depend on projects to auto-select new groups

  // --- Actions ---

  const addProject = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      icon: 'Box', // Default icon
      groups: []
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const addGroup = (name: string) => {
    if (!activeProjectId) return;
    const newGroup: ProjectGroup = {
      id: crypto.randomUUID(),
      name,
      items: []
    };
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, groups: [...p.groups, newGroup] };
      }
      return p;
    }));
    setActiveGroupId(newGroup.id);
  };

  const deleteGroup = (projectId: string, groupId: string) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            return { ...p, groups: p.groups.filter(g => g.id !== groupId) };
        }
        return p;
    }));
    if (activeGroupId === groupId) setActiveGroupId(null);
  };

  const addItem = (item: SecretItem) => {
    if (!activeProjectId || !activeGroupId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updatedGroups = p.groups.map(g => {
          if (g.id === activeGroupId) {
            return { ...g, items: [...g.items, item] };
          }
          return g;
        });
        return { ...p, groups: updatedGroups };
      }
      return p;
    }));
  };

  const deleteItem = (itemId: string) => {
    if (!activeProjectId || !activeGroupId) return;
    setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            const updatedGroups = p.groups.map(g => {
                if (g.id === activeGroupId) {
                    return { ...g, items: g.items.filter(i => i.id !== itemId) };
                }
                return g;
            });
            return { ...p, groups: updatedGroups };
        }
        return p;
    }));
  };

  const updateItem = (itemId: string, updates: Partial<SecretItem>) => {
    if (!activeProjectId || !activeGroupId) return;
    setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            const updatedGroups = p.groups.map(g => {
                if (g.id === activeGroupId) {
                    const newItems = g.items.map(i => i.id === itemId ? { ...i, ...updates } : i);
                    return { ...g, items: newItems };
                }
                return g;
            });
            return { ...p, groups: updatedGroups };
        }
        return p;
    }));
  };

  // --- Derived State ---
  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const activeGroup = activeProject?.groups.find(g => g.id === activeGroupId) || null;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background text-slate-200 overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface">
        <span className="font-bold text-lg">ConfigVault</span>
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
            projects={projects} 
            activeProjectId={activeProjectId} 
            onSelectProject={(id) => { setActiveProjectId(id); setActiveGroupId(null); if(window.innerWidth < 768) setMobileMenuOpen(false); }}
            onAddProject={addProject}
            onDeleteProject={deleteProject}
          />

          <SidebarGroups 
            activeProject={activeProject}
            activeGroupId={activeGroupId}
            onSelectGroup={(id) => { setActiveGroupId(id); if(window.innerWidth < 768) setMobileMenuOpen(false); }}
            onAddGroup={addGroup}
            onDeleteGroup={deleteGroup}
          />
      </div>

      {/* Content Area (Always visible on desktop, visible under menu on mobile) */}
      <div className="flex-1 h-full overflow-hidden relative z-0">
          <ContentArea 
            group={activeGroup} 
            onAddItem={addItem}
            onDeleteItem={deleteItem}
            onUpdateItem={updateItem}
          />
      </div>

    </div>
  );
}
