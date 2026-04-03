import React, { useState } from 'react';
import { Project } from '../types';
import { DynamicIcon } from './Icons';
import { Plus, Trash2, FolderOpen } from 'lucide-react';

interface SidebarProjectsProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
}

export const SidebarProjects: React.FC<SidebarProjectsProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddProject(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border w-64 flex-shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">项目列表</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-1 hover:bg-surface rounded text-gray-400 hover:text-white transition-colors"
          title="添加项目"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isAdding && (
          <form onSubmit={handleAdd} className="mb-2 px-2">
            <input
              autoFocus
              type="text"
              className="w-full bg-surface text-sm px-2 py-1 rounded border border-primary focus:outline-none text-white placeholder-gray-500"
              placeholder="项目名称..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => !newName && setIsAdding(false)}
            />
          </form>
        )}

        {projects.length === 0 && (
            <div className="text-center p-4 text-gray-500 text-xs">
                暂无项目，请点击右上角添加。
            </div>
        )}

        {projects.map((proj) => (
          <div
            key={proj.id}
            className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all ${
              activeProjectId === proj.id
                ? 'bg-surface text-white shadow-sm border border-border/50'
                : 'text-gray-400 hover:bg-surface/50 hover:text-gray-200'
            }`}
            onClick={() => onSelectProject(proj.id)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <DynamicIcon name={proj.icon} size={18} className={activeProjectId === proj.id ? 'text-primary' : ''} />
              <span className="text-sm font-medium truncate">{proj.name}</span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if(confirm(`确定要删除项目 "${proj.name}" 吗?`)) onDeleteProject(proj.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-border text-xs text-gray-600 flex items-center gap-2">
         <FolderOpen size={14} />
         <span>本地存储模式 (LocalStorage)</span>
      </div>
    </div>
  );
};
