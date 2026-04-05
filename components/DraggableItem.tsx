import React, { useRef, useState, useEffect } from 'react';
import { Card } from '../types';
import { ItemCard } from './ItemCard';
import { useBoardStore } from '../store/useBoardStore';

interface DraggableItemProps {
  item: Card;
  selected?: boolean;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({ item, selected }) => {
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const originalPos = useRef({ x: item.x, y: item.y });

  const updateCard = useBoardStore(state => state.updateCard);
  const deleteCard = useBoardStore(state => state.deleteCard);

  // Allow interaction components to render
  return (
    <div
      className={`absolute pointer-events-auto ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl z-50' : 'z-10'}`}
      style={{
        left: item.x,
        top: item.y,
        // Optional: transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
      }}
      onPointerDown={(e) => {
        if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('.cursor-grab')) return;
        
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        
        isDragging.current = true;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        originalPos.current = { x: item.x, y: item.y };
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return;
        
        // This is a naive translation. We need to account for canvas scale!
        // A movement of 1 pixel on screen equals 1 / scale in the world.
        // For simplicity, we just use raw movement for now, but we must fix this in Phase 1's final steps. 
        // We'll calculate delta based on zoom context passed via store or custom event, or we can just access DOM.
        
        // Assuming we have access to scale. Let's just do it directly via parent for now or DOM.
        const parentTransform = e.currentTarget.parentElement?.style.transform;
        let scale = 1;
        if (parentTransform) {
          const match = parentTransform.match(/scale\(([^)]+)\)/);
          if (match) scale = parseFloat(match[1]);
        }

        const dx = (e.clientX - dragStartPos.current.x) / scale;
        const dy = (e.clientY - dragStartPos.current.y) / scale;

        updateCard(item.id, {
          x: originalPos.current.x + dx,
          y: originalPos.current.y + dy
        });
      }}
      onPointerUp={(e) => {
        isDragging.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }}
    >
      <ItemCard 
         item={item}
         isGridView={false}
         isCanvasView={true}
         onCopy={(val) => navigator.clipboard.writeText(val)}
         onDelete={() => deleteCard(item.id)}
         onUpdate={(updates) => updateCard(item.id, updates)}
      />
    </div>
  );
};
