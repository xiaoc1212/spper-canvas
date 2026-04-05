import React, { useState } from 'react';
import { Project, ProjectGroup } from '../types';
import { Plus, Trash2, Folder, Layers } from 'lucide-react';

interface SidebarGroupsProps {
  activeProject: Project | null;
  activeGroupId: string | null;
  onSelectGroup: (id: string) => void;
  onAddGroup: (name: string) => void;
  onDeleteGroup: (projectId: string, groupId: string) => void;
}

export const SidebarGroups: React.FC<SidebarGroupsProps> = ({
  activeProject,
  activeGroupId,
  onSelectGroup,
  onAddGroup,
  onDeleteGroup
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  if (!activeProject) {
    return (
      <div className="flex flex-col h-full bg-[#162032] border-r border-border w-64 flex-shrink-0 items-center justify-center text-gray-500 p-6 text-center">
        <Layers size={48} className="mb-4 opacity-20" />
        <p className="text-sm">请选择一个项目以查看配置组</p>
      </div>
    );
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddGroup(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#162032] border-r border-border w-64 flex-shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="truncate pr-2">
            <h2 className="text-xs text-primary font-bold uppercase tracking-wider mb-1">分组</h2>
            <div className="text-sm font-semibold text-white truncate">{activeProject.name}</div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-1 hover:bg-surface rounded text-gray-400 hover:text-white transition-colors"
          title="添加分组"
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
              className="w-full bg-background text-sm px-2 py-1 rounded border border-primary focus:outline-none text-white placeholder-gray-500"
              placeholder="分组名称 (如: API Key)..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => !newName && setIsAdding(false)}
            />
          </form>
        )}

        {activeProject.groups.length === 0 && !isAdding && (
            <div className="text-center p-4 text-gray-500 text-xs italic">
                暂无分组。请添加一个，例如“API密钥”或“数据库”。
            </div>
        )}

        {activeProject.groups.map((group) => (
          <div
            key={group.id}
            className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all ${
              activeGroupId === group.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-gray-400 hover:bg-surface hover:text-gray-200'
            }`}
            onClick={() => onSelectGroup(group.id)}
          >
             <div className="flex items-center gap-3 overflow-hidden">
              <Folder size={16} className={activeGroupId === group.id ? 'fill-primary/20' : ''} />
              <span className="text-sm font-medium truncate">{group.name}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if(confirm(`确定要删除分组 "${group.name}" 吗?`)) onDeleteGroup(activeProject.id, group.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
