import React, { useState } from 'react';
import { Board, ItemType, Card } from '../types';
import { useBoardStore } from '../store/useBoardStore';
import { CanvasBoard } from './CanvasBoard';
import { Sparkles, Plus, LayoutGrid, MousePointer2 } from 'lucide-react';
import { ItemCard } from './ItemCard';

interface ContentAreaProps {
  activeBoard: Board | null;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ activeBoard }) => {
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');
  const [isImporting, setIsImporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const cardsMap = useBoardStore(state => state.cards);
  const activeCards = activeBoard ? Object.values(cardsMap).filter(c => c.boardId === activeBoard.id) : [];

  if (!activeBoard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0f172a] h-full">
        <Sparkles size={48} className="mb-4 opacity-20" />
        <p className="text-sm">选一个画板来开始创作吧</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a] relative">
      {/* Top Header / Toolbar */}
      <div className="h-14 border-b border-white/10 bg-[#162032] flex items-center justify-between px-6 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-wide">{activeBoard?.name}</h1>
            <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded font-mono border border-primary/20">{activeCards.length}</span>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/5">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    title="网格视图"
                >
                    <LayoutGrid size={18} />
                </button>
                <button
                    onClick={() => setViewMode('canvas')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'canvas' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    title="画板视图"
                >
                    <MousePointer2 size={18} />
                </button>
            </div>

            <button
                onClick={() => setIsAdding(!isAdding)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isAdding 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-primary text-white hover:bg-blue-600 shadow-lg shadow-blue-900/20'
                }`}
            >
                {isAdding ? '取消' : (
                    <>
                        <Plus size={18} />
                        <span className="hidden sm:inline">从模板新建</span>
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Main Area */}
      {viewMode === 'canvas' ? (
         <CanvasBoard activeBoard={activeBoard} />
      ) : (
         <div className="flex-1 overflow-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-32">
             {activeCards.map(c => (
                 <ItemCard 
                    key={c.id} 
                    item={c} 
                    isGridView={true} 
                    isCanvasView={false} 
                    onCopy={() => {}} 
                    onDelete={() => useBoardStore.getState().deleteCard(c.id)} 
                    onUpdate={(updates) => useBoardStore.getState().updateCard(c.id, updates)} 
                 />
             ))}
         </div>
      )}
    </div>
  );
};
