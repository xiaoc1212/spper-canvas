import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Board, ItemType, Card } from '../types';
import { useBoardStore } from '../store/useBoardStore';
import { screenToWorld, worldToScreen, zoomToCursor } from '../utils/camera';
import { DraggableItem } from './DraggableItem';
import { motion } from 'motion/react';
import { Sparkles, Terminal, Key, Type, Image as ImageIcon, StickyNote, Network, Link2 } from 'lucide-react';

const TOOL_ITEMS: { type: ItemType; icon: any; label: string; color: string }[] = [
  { type: 'note',     icon: StickyNote, label: '笔记',   color: '#eab308' },
  { type: 'text',     icon: Type,       label: '文本',   color: '#3b82f6' },
  { type: 'password', icon: Key,        label: '密码',   color: '#ef4444' },
  { type: 'code',     icon: Terminal,   label: '代码',   color: '#22c55e' },
  { type: 'image',    icon: ImageIcon,  label: '图片',   color: '#a855f7' },
  { type: 'link',     icon: Link2,      label: '链接',   color: '#06b6d4' },
  { type: 'mindmap',  icon: Network,    label: '思维图', color: '#14b8a6' },
];

interface CanvasBoardProps {
  activeBoard: Board;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5.0;

export const CanvasBoard: React.FC<CanvasBoardProps> = ({ activeBoard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [ghostDrag, setGhostDrag] = useState<{ type: ItemType; x: number; y: number } | null>(null);
  const ghostDragTypeRef = useRef<ItemType | null>(null);

  const cardsMap = useBoardStore(state => state.cards);
  const addCard = useBoardStore(state => state.addCard);
  const activeCards = Object.values(cardsMap).filter(c => c.boardId === activeBoard.id);

  // Center on mount
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCamera({ x: rect.width / 2, y: rect.height / 2, scale: 1 });
    }
  }, [activeBoard.id]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setCamera(prev => zoomToCursor(e.clientX, e.clientY, prev, zoomFactor, MIN_SCALE, MAX_SCALE));
    } else {
      setCamera(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      containerRef.current?.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setCamera(prev => ({ ...prev, x: prev.x + e.movementX, y: prev.y + e.movementY }));
    } else if (ghostDrag) {
      setGhostDrag(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      containerRef.current?.releasePointerCapture(e.pointerId);
    }

    if (ghostDragTypeRef.current && containerRef.current) {
      const pos = screenToWorld(e.clientX, e.clientY, camera);
      addCard({
        id: crypto.randomUUID(),
        boardId: activeBoard.id,
        type: ghostDragTypeRef.current,
        x: pos.x,
        y: pos.y,
        label: '',
        value: '',
        isNew: true
      });
      setGhostDrag(null);
      ghostDragTypeRef.current = null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-[#18181b] overflow-hidden relative cursor-crosshair select-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseLeave={() => { setGhostDrag(null); ghostDragTypeRef.current = null; }}
    >
      {/* Milanote Toolbar */}
      <div className="toolbar-container absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 bg-[#18181b] border border-white/10 p-2 rounded-xl shadow-[4px_0_24px_rgba(0,0,0,0.5)] select-none">
        {TOOL_ITEMS.map(({ type, icon: Icon, label, color }) => (
          <div key={type} className="group relative"
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              e.stopPropagation();
              ghostDragTypeRef.current = type;
              setGhostDrag({ type, x: e.clientX, y: e.clientY });
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 hover:-translate-x-1.5 hover:scale-105 hover:brightness-125"
              style={{ background: `${color}22`, border: `1.5px solid ${color}55`, boxShadow: `0 4px 12px ${color}33` }}
            >
              <Icon size={20} />
            </div>
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-[#27272a] border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
              {label}
            </div>
          </div>
        ))}
      </div>

      {ghostDrag && (
        <div className="fixed pointer-events-none z-[9999]" style={{ left: ghostDrag.x + 12, top: ghostDrag.y - 24 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-28 rounded-lg shadow-xl border px-3 py-3 flex flex-col items-center gap-1.5 bg-[#27272a] border-white/10">
            {(() => { const t = TOOL_ITEMS.find(i => i.type === ghostDrag.type); const Icon = t?.icon || Type; return <Icon size={20} className="text-gray-300" />; })()}
            <span className="text-xs text-gray-300 font-medium">{TOOL_ITEMS.find(i => i.type === ghostDrag.type)?.label}</span>
          </motion.div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute right-6 bottom-6 z-50 flex items-center gap-1 bg-[#18181b] border border-white/10 p-1.5 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
        <button onClick={() => setCamera(p => zoomToCursor(containerRef.current!.clientWidth/2, containerRef.current!.clientHeight/2, p, 0.9, MIN_SCALE, MAX_SCALE))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#27272a] text-gray-400 hover:text-gray-100 transition-colors text-lg" title="缩小">−</button>
        <div className="w-14 text-center text-[13px] font-medium text-gray-400 hover:bg-[#27272a] py-1 rounded-lg cursor-pointer hover:text-gray-200 transition-colors" title="恢复100%" onClick={() => setCamera(p => ({ ...p, scale: 1 }))}>{Math.round(camera.scale * 100)}%</div>
        <button onClick={() => setCamera(p => zoomToCursor(containerRef.current!.clientWidth/2, containerRef.current!.clientHeight/2, p, 1.1, MIN_SCALE, MAX_SCALE))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#27272a] text-gray-400 hover:text-gray-100 transition-colors text-lg" title="放大">+</button>
      </div>

      {/* Hardware Accelerated Canvas Layer */}
      <div 
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{ transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`, willChange: 'transform' }}
      >
          <div className="absolute inset-[-10000px] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          {activeCards.map(card => (
             <DraggableItem key={card.id} item={card} />
          ))}
      </div>
    </div>
  );
};
