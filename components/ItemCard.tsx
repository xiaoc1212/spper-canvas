
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SecretItem as Card, ItemType } from '../types';
import { Copy, Eye, EyeOff, Plus, Trash2, Check, Terminal, Key, Type, Save, LayoutGrid, List, Sparkles, X, ArrowRight, Image as ImageIcon, StickyNote, MousePointer2, Network, GripVertical, Link2, ExternalLink, Palette } from 'lucide-react';

import { motion, useMotionValue } from 'motion/react';
import TextareaAutosize from 'react-textarea-autosize';

const CANVAS_SIZE = 6400;

// Note color presets
const NOTE_COLORS = [
  { name: '默认', bg: 'bg-surface', border: 'border-border', text: 'text-gray-300' },
  { name: '黄色', bg: 'bg-yellow-900/40', border: 'border-yellow-700/50', text: 'text-yellow-100' },
  { name: '绿色', bg: 'bg-green-900/40', border: 'border-green-700/50', text: 'text-green-100' },
  { name: '蓝色', bg: 'bg-blue-900/40', border: 'border-blue-700/50', text: 'text-blue-100' },
  { name: '紫色', bg: 'bg-purple-900/40', border: 'border-purple-700/50', text: 'text-purple-100' },
  { name: '粉色', bg: 'bg-pink-900/40', border: 'border-pink-700/50', text: 'text-pink-100' },
  { name: '橙色', bg: 'bg-orange-900/40', border: 'border-orange-700/50', text: 'text-orange-100' },
];

const NOTE_COLOR_DOTS = [
  '#475569', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#ea580c'
];

// Type-specific left accent colors
const TYPE_ACCENT: Record<string, string> = {
  text: '#3b82f6',
  password: '#ef4444',
  code: '#22c55e',
  image: '#a855f7',
  note: '#eab308',
  mindmap: '#14b8a6',
};


export const ItemCard: React.FC<{
  item: Card;
  onCopy: (val: string) => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Card>) => void;
  isGridView: boolean;
  isCanvasView?: boolean;
  onAddChild?: () => void;
  onAddSibling?: () => void;
}> = ({ item, onCopy, onDelete, onUpdate, isGridView, isCanvasView, onAddChild, onAddSibling }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editLabel, setEditLabel] = useState(item.label);
  const [editValue, setEditValue] = useState(item.value);

  const [isEditingContent, setIsEditingContent] = useState(false);
  const [inlineValue, setInlineValue] = useState(item.value);

  useEffect(() => {
  }, [item.isNew, item.type, onUpdate]);

  const handleInlineSave = () => {
      if (inlineValue !== item.value) {
          onUpdate({ value: inlineValue });
      }
      setIsEditingContent(false);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleInlineSave();
      } else if (e.key === 'Escape') {
          setInlineValue(item.value);
          setIsEditingContent(false);
      }
  };

  const handleCopy = () => {
    onCopy(item.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdate({ label: editLabel, value: editValue });
    setIsEditing(false);
  };

  const TypeIcon = item.type === 'code' ? Terminal : item.type === 'password' ? Key : item.type === 'image' ? ImageIcon : item.type === 'note' ? StickyNote : item.type === 'link' ? Link2 : Type;

    const [noteColorIdx, setNoteColorIdx] = useState(item.noteColor || 0);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const noteColor = NOTE_COLORS[noteColorIdx] || NOTE_COLORS[0];
    const accentColor = TYPE_ACCENT[item.type] || TYPE_ACCENT.text;

    // ========== MINDMAP NODE ==========
    if (item.type === 'mindmap' && isCanvasView) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="relative group/mm min-w-[200px]"
            >
                <div className="bg-[#18181b] border border-white/10 hover:border-white/20 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all text-gray-200">
                    <div className="px-4 py-3 text-[14px] w-full min-h-[44px] flex items-center justify-center text-center">
                        {isEditingContent ? (
                            <TextareaAutosize
                                autoFocus
                                value={inlineValue}
                                onChange={e => setInlineValue(e.target.value)}
                                onBlur={handleInlineSave}
                                onKeyDown={handleInlineKeyDown}
                                className="w-full bg-transparent border-none text-center focus:outline-none resize-none font-medium text-white"
                                onPointerDownCapture={e => e.stopPropagation()}
                            />
                        ) : (
                            <div onDoubleClick={() => setIsEditingContent(true)} className="w-full break-words font-medium">
                                {item.value || <span className="text-gray-500/70 italic font-normal">中心主题</span>}
                            </div>
                        )}
                    </div>
                </div>
                
                {onAddChild && !isEditingContent && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddChild(); }}
                        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-teal-500 ring-[#18181b] text-white rounded-full flex items-center justify-center opacity-0 group-hover/mm:opacity-100 hover:scale-110 hover:bg-teal-400 shadow-lg transition-all z-50 ring-2 ring-[#0f172a] cursor-pointer"
                        title="添加子节点"
                    ><Plus size={12} /></button>
                )}
                {onAddSibling && !isEditingContent && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddSibling(); }}
                        className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-5 h-5 bg-blue-500 ring-[#18181b] hover:bg-blue-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover/mm:opacity-100 hover:scale-110 shadow-lg transition-all z-50 ring-2 ring-[#0f172a] cursor-pointer"
                        title="添加同级节点"
                    ><Plus size={12} /></button>
                )}
                <div className="absolute top-[-10px] right-[-10px] opacity-0 group-hover/mm:opacity-100 transition-opacity z-50">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1 px-1 text-white bg-red-500 hover:bg-red-400 rounded-full shadow-md cursor-pointer transition-colors"
                        title="删除"
                    ><X size={12} /></button>
                </div>
            </motion.div>
        );
    }

    // ========== EDIT MODE (all types) ==========
    if (isEditing) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-surface border border-primary/50 rounded-xl p-4 shadow-lg ${isGridView ? 'col-span-1' : 'mb-3'} ${isCanvasView ? 'w-64' : ''}`}
                onPointerDownCapture={(e) => { e.stopPropagation(); e.nativeEvent.stopPropagation(); }}
                onMouseDownCapture={(e) => { e.stopPropagation(); e.nativeEvent.stopPropagation(); }}
                onTouchStartCapture={(e) => { e.stopPropagation(); e.nativeEvent.stopPropagation(); }}
            >
                <div className="flex flex-col gap-3">
                    <input 
                        value={editLabel} 
                        onChange={e => setEditLabel(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                        placeholder="名称"
                    />
                    {item.type === 'image' ? (
                        <input 
                            value={editValue} 
                            onChange={e => setEditValue(e.target.value)}
                            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:border-primary focus:outline-none"
                            placeholder="图片 URL"
                        />
                    ) : (
                        <textarea 
                            value={editValue} 
                            onChange={e => setEditValue(e.target.value)}
                            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-gray-300 font-mono h-24 focus:border-primary focus:outline-none resize-none"
                            placeholder="内容"
                        />
                    )}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 text-gray-400">取消</button>
                        <button onClick={handleSave} className="flex items-center gap-1 text-xs bg-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg">
                            <Save size={14}/> 保存
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ========== IMAGE CARD ==========
    if (item.type === 'image') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`group ${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} rounded-2xl overflow-hidden transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 hover:border-white/20 relative`}
            >
                <div className="relative bg-transparent flex items-center justify-center min-h-[120px]">
                    {item.value ? (
                        <div className="relative w-full h-auto">
                            <img src={item.value} alt={item.label} className="w-full h-auto object-cover block" referrerPolicy="no-referrer" />
                            {item.label && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-10 pb-3 px-4 text-[13px] font-medium text-white truncate">{item.label}</div>}
                        </div>
                    ) : (
                        <div className="py-10 flex flex-col w-full items-center gap-2 text-gray-500/50">
                            <ImageIcon size={28} className="opacity-40" />
                            <span className="text-[12px] italic select-none">暂无图片</span>
                        </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        
                        <button onClick={onDelete} className="p-1.5 text-red-400 bg-black/40 hover:bg-black/60 hover:text-red-300 backdrop-blur-md rounded-md transition-colors" title="删除"><Trash2 size={13} /></button>
                    </div>
                </div>
            </motion.div>
        );
    }
    // ========== NOTE CARD ==========
    if (item.type === 'note') {
        const bgColors = ['#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#e5e7eb', '#18181b', '#451a03'];
        const textColors = ['#92400e', '#9d174d', '#1e3a8a', '#166534', '#374151', '#d1d5db', '#fcd34d'];
        const cIdx = Math.min(noteColorIdx, 6) || 0;
        const currentBg = bgColors[cIdx];
        const currentText = textColors[cIdx];

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`group ${isCanvasView ? 'w-[260px]' : isGridView ? 'h-full' : 'mb-3'} rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all relative`}
                style={{ backgroundColor: currentBg, border: cIdx === 5 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
            >
                <div className="flex items-center justify-between px-3 pt-2 pb-1  select-none" style={{ color: currentText }}>
                    <div className="flex items-center gap-1.5 overflow-hidden opacity-70">
                        <StickyNote size={13} className="flex-shrink-0" />
                        {item.label && <span className="text-[11px] font-semibold truncate uppercase tracking-wider select-none">{item.label}</span>}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-1 px-1.5 hover:bg-black/10 rounded-sm transition-colors" title="颜色"><Palette size={13} /></button>
                        
                        <button onClick={onDelete} className="p-1 px-1.5 hover:bg-black/10 hover:text-red-700 rounded-sm transition-colors" title="删除"><Trash2 size={13} /></button>
                    </div>
                </div>

                {showColorPicker && (
                    <div className="flex flex-wrap justify-between gap-1.5 px-3 py-2 bg-black/5" onPointerDownCapture={e => e.stopPropagation()}>
                        {bgColors.map((c, i) => (
                            <button
                                key={i}
                                onClick={() => { setNoteColorIdx(i); setShowColorPicker(false); onUpdate({ noteColor: i }); }}
                                className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110 ${noteColorIdx === i ? 'ring-2 ring-black/30' : ''}`}
                                style={{ background: c }}
                            />
                        ))}
                    </div>
                )}

                <div className="px-3 pb-4 pt-1" onPointerDownCapture={e => { if (isEditingContent) e.stopPropagation(); }}>
                    {isEditingContent ? (
                        <textarea
                            autoFocus
                            value={inlineValue}
                            onChange={e => setInlineValue(e.target.value)}
                            onBlur={handleInlineSave}
                            onKeyDown={handleInlineKeyDown}
                            className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[120px] text-[14px] leading-relaxed"
                            style={{ color: currentText }}
                            onPointerDownCapture={e => e.stopPropagation()}
                        />
                    ) : (
                        <div 
                            onDoubleClick={() => setIsEditingContent(true)}
                            className={`text-[14px] leading-relaxed whitespace-pre-wrap cursor-text min-h-[120px] ${isGridView ? 'overflow-y-auto max-h-48' : ''}`}
                            style={{ color: currentText }}
                        >
                            {item.value || <span className="opacity-40 italic">点击输入内容...</span>}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }
    // ========== CODE CARD ==========
    if (item.type === 'code') {
        const lang = item.label || 'javascript';
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`group ${isCanvasView ? 'w-auto min-w-[300px] max-w-[500px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all relative `}
            >
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#27272a] border-b border-white/5 select-none">
                    <span className="text-[11px] font-mono font-medium text-gray-400 select-none uppercase tracking-widest">{lang}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleCopy} className={`p-1 rounded-sm transition-colors ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white hover:bg-[#3f3f46]'}`} title="复制">
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        
                        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400 rounded-sm hover:bg-[#3f3f46]" title="删除"><Trash2 size={13} /></button>
                    </div>
                </div>
                <div className="p-3 bg-[#18181b]" onPointerDownCapture={e => { if (isEditingContent) e.stopPropagation(); }}>
                    {isEditingContent ? (
                        <TextareaAutosize
                            autoFocus
                            value={inlineValue}
                            onChange={e => setInlineValue(e.target.value)}
                            onBlur={handleInlineSave}
                            onKeyDown={handleInlineKeyDown}
                            className="w-full bg-transparent text-[13px] text-gray-300 font-mono focus:outline-none resize-none selection:bg-blue-500/30"
                            onPointerDownCapture={e => e.stopPropagation()}
                        />
                    ) : (
                        <div onDoubleClick={() => setIsEditingContent(true)}
                            className={`text-[13px] text-gray-300 font-mono whitespace-pre cursor-text min-h-[40px] selection:bg-blue-500/30 ${isGridView ? 'overflow-y-auto max-h-48' : ''}`}
                        >
                            {item.value || <span className="text-gray-600 italic select-none">点击输入代码...</span>}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }
    // ========== PASSWORD CARD ==========
    if (item.type === 'password') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`group ${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all p-4 flex flex-col  relative`}
            >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    
                    <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400 rounded-sm hover:bg-[#3f3f46]" title="删除"><Trash2 size={13} /></button>
                </div>
                <div className="flex items-center gap-2 mb-3 select-none">
                    <Key size={14} className="text-gray-500" />
                    <span className="text-[13px] font-semibold text-gray-300 tracking-wide">账号密码</span>
                </div>
                <div className="mb-3">
                    <div className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-widest select-none">用户名</div>
                    <div className="text-[13px] font-medium text-gray-200 break-all bg-[#27272a] px-3 py-1.5 rounded border border-white/5 select-text">{item.label || '暂无'}</div>
                </div>
                <div className="relative" onPointerDownCapture={e => { if (isEditingContent) e.stopPropagation(); }}>
                    <div className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-widest select-none">密码</div>
                    {isEditingContent ? (
                        <TextareaAutosize
                            autoFocus
                            value={inlineValue}
                            onChange={e => setInlineValue(e.target.value)}
                            onBlur={handleInlineSave}
                            onKeyDown={handleInlineKeyDown}
                            className="w-full bg-[#27272a] text-[13px] text-gray-300 font-mono focus:outline-none resize-none px-3 py-1.5 border border-white/10 rounded shadow-inner"
                            onPointerDownCapture={e => e.stopPropagation()}
                        />
                    ) : (
                        <div onDoubleClick={() => setIsEditingContent(true)} className="flex items-center justify-between cursor-text bg-[#27272a] border border-white/5 rounded px-3 py-1.5 group/pwd hover:bg-[#3f3f46] transition-colors">
                            <code className="text-[13px] font-mono text-gray-300 flex-1 truncate select-none">
                                {revealed ? item.value : '•'.repeat(Math.min(item.value.length, 24) || 12)}
                            </code>
                            <div className="flex items-center gap-1 opacity-50 group-hover/pwd:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }} className="p-1 text-gray-400 hover:text-white rounded-sm hover:bg-[#3f3f46]" title={revealed ? '隐藏' : '显示'}>
                                    {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className={`p-1 rounded-sm hover:bg-[#3f3f46] ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white'}`} title="复制">
                                    {copied ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }
    // ========== LINK CARD ==========
    if (item.type === 'link') {
        let urlHost = '未知链接';
        try {
            if (item.value && item.value.startsWith('http')) {
                urlHost = new URL(item.value).hostname;
            }
        } catch (e) {
            urlHost = item.value;
        }

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`group ${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all  flex flex-col relative`}
            >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    
                    <button onClick={onDelete} className="p-1.5 text-red-400 bg-[#27272a] hover:bg-[#3f3f46] border border-white/10 rounded-sm transition-colors" title="删除"><Trash2 size={13} /></button>
                </div>

                <div className="relative bg-[#27272a] flex items-center justify-center min-h-[120px] border-b border-white/5">
                    {item.value && item.value.startsWith('http') ? (
                        <div className="w-full h-full absolute inset-0 flex items-center justify-center group-hover:bg-[#3f3f46]/50 transition-colors">
                            <ExternalLink size={28} className="text-gray-500" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-600">
                            <Link2 size={24} className="opacity-40" />
                            <span className="text-xs">无链接</span>
                        </div>
                    )}
                </div>
                <div className="p-3 bg-transparent flex flex-col justify-center min-h-[60px]">
                    <div className="text-[13px] font-semibold text-gray-200 truncate mb-1 select-none" title={item.label}>{item.label || urlHost}</div>
                    <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
                        <a href={item.value} target="_blank" rel="noreferrer" onPointerDown={e => e.stopPropagation()} className="text-[11px] font-mono text-blue-400 truncate hover:underline" title={item.value}>
                            {item.value || '点击设置链接'}
                        </a>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ========== TEXT CARD ==========
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className={`group ${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all flex flex-col`}
        >
            <div className="flex items-center justify-between px-3 py-2 bg-[#27272a] border-b border-white/5  select-none">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Type size={13} className="text-gray-400" />
                    {item.label ? (
                        <span className="text-[12px] font-semibold text-gray-200 truncate select-none uppercase tracking-wider">{item.label}</span>
                    ) : (
                        <span className="text-[12px] italic text-gray-500 select-none">文本</span>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleCopy} className={`p-1 rounded-sm transition-colors ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white hover:bg-[#3f3f46]'}`} title="复制">
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    
                    <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400 rounded-sm hover:bg-[#3f3f46]" title="删除"><Trash2 size={13} /></button>
                </div>
            </div>
            <div className="relative flex-1 p-3 bg-transparent min-h-[100px]" onPointerDownCapture={e => { if (isEditingContent) e.stopPropagation(); }}>
                {isEditingContent ? (
                    <TextareaAutosize
                        autoFocus
                        value={inlineValue}
                        onChange={e => setInlineValue(e.target.value)}
                        onBlur={handleInlineSave}
                        onKeyDown={handleInlineKeyDown}
                        className="w-full bg-transparent text-[13px] leading-relaxed text-gray-300 focus:outline-none resize-none"
                        onPointerDownCapture={e => e.stopPropagation()}
                    />
                ) : (
                    <div onDoubleClick={() => setIsEditingContent(true)}
                        className={`text-[13px] leading-relaxed text-gray-300 break-words cursor-text ${isGridView ? 'overflow-y-auto max-h-48' : ''}`}
                    >
                        {item.value || <span className="text-gray-600 italic">点击输入文本...</span>}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const DraggableItem = ({ item, isSelected, onSelect, onUpdate, onAddChild, onAddSibling, group, selectedIds, onUpdateMultiple, handleCopy, onDeleteItem, allItems, onSetGuides, canvasScale = 1, onDragStart }: any) => {
    const x = useMotionValue(item.x || 0);
    const y = useMotionValue(item.y || 0);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef<{ mx: number; my: number; ix: number; iy: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [snapGlow, setSnapGlow] = useState<'left'|'right'|'top'|'bottom'|null>(null);
    const CARD_WIDTH = item.type === 'mindmap' ? 192 : 256;
    const CARD_H = item.type === 'mindmap' ? 44 : 120;
    const SNAP_GAP = 10;       // minimum gap between cards
    const SNAP_DETECT = 25;    // proximity detection range for glow
    const OVERLAP_LIMIT = 0.3; // if overlap > 30% of card area, don't snap

    useEffect(() => {
        if (!isDraggingRef.current) {
            x.set(item.x || 0);
            y.set(item.y || 0);
        }
    }, [item.x, item.y, x, y]);

    // Compute overlap ratio between two rectangles
    const getOverlapRatio = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) => {
        const ox = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx));
        const oy = Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by));
        const overlapArea = ox * oy;
        const myArea = aw * ah;
        return myArea > 0 ? overlapArea / myArea : 0;
    };

    // Find best snap target for release
    const findSnapTarget = (cx: number, cy: number) => {
        if (!allItems || (isSelected && selectedIds && selectedIds.size > 1)) return null;
        let bestSnap: { x: number; y: number; side: string } | null = null;
        let bestDist = Infinity;

        for (const other of allItems) {
            if (other.id === item.id) continue;
            const ow = other.type === 'mindmap' ? 192 : 256;
            const oh = other.type === 'mindmap' ? 44 : 120;
            const oL = other.x || 0, oR = oL + ow, oT = other.y || 0, oB = oT + oh;

            // Check overlap - if too much, skip this card for snapping
            const overlap = getOverlapRatio(cx, cy, CARD_WIDTH, CARD_H, oL, oT, ow, oh);
            if (overlap > OVERLAP_LIMIT) continue;

            // Check if vertically overlapping (cards are side by side)
            const vOverlap = Math.min(cy + CARD_H, oB) - Math.max(cy, oT);
            // Check if horizontally overlapping (cards are stacked)
            const hOverlap = Math.min(cx + CARD_WIDTH, oR) - Math.max(cx, oL);

            if (vOverlap > 10) { // cards have vertical overlap => side-by-side snap candidate
                // My right edge near other left edge
                const distRL = Math.abs((cx + CARD_WIDTH) - oL);
                if (distRL < SNAP_DETECT && distRL < bestDist) {
                    bestDist = distRL;
                    bestSnap = { x: oL - SNAP_GAP - CARD_WIDTH, y: cy, side: 'right' };
                }
                // My left edge near other right edge
                const distLR = Math.abs(cx - oR);
                if (distLR < SNAP_DETECT && distLR < bestDist) {
                    bestDist = distLR;
                    bestSnap = { x: oR + SNAP_GAP, y: cy, side: 'left' };
                }
            }

            if (hOverlap > 10) { // cards have horizontal overlap => stacked snap candidate
                // My bottom near other top
                const distBT = Math.abs((cy + CARD_H) - oT);
                if (distBT < SNAP_DETECT && distBT < bestDist) {
                    bestDist = distBT;
                    bestSnap = { x: cx, y: oT - SNAP_GAP - CARD_H, side: 'bottom' };
                }
                // My top near other bottom
                const distTB = Math.abs(cy - oB);
                if (distTB < SNAP_DETECT && distTB < bestDist) {
                    bestDist = distTB;
                    bestSnap = { x: cx, y: oB + SNAP_GAP, side: 'top' };
                }
            }
        }
        return bestSnap;
    };

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

        if (!isSelected) {
            onSelect(item.id, e.shiftKey);
        }
        e.stopPropagation();
        e.nativeEvent.stopPropagation();

        isDraggingRef.current = false;
        dragStartRef.current = { mx: e.clientX, my: e.clientY, ix: x.get(), iy: y.get() };
        if (onDragStart) onDragStart();
        document.body.style.userSelect = 'none';

        const onMove = (ev: PointerEvent) => {
            if (!dragStartRef.current) return;
            const { mx, my, ix, iy } = dragStartRef.current;
            const dx = (ev.clientX - mx) / canvasScale;
            const dy = (ev.clientY - my) / canvasScale;

            if (!isDraggingRef.current) {
                if (Math.abs(ev.clientX - mx) > 3 || Math.abs(ev.clientY - my) > 3) {
                    isDraggingRef.current = true;
                    setIsDragging(true);
                } else {
                    return;
                }
            }

            let newX = ix + dx;
            let newY = iy + dy;
            newX = Math.max(0, Math.min(CANVAS_SIZE - CARD_WIDTH, newX));
            newY = Math.max(0, Math.min(CANVAS_SIZE - 200, newY));

            // --- Proximity detection: show guides + glow (no snapping during drag) ---
            const newGuides: {type:'h'|'v'; pos:number}[] = [];
            let glowDir: 'left'|'right'|'top'|'bottom'|null = null;

            if (allItems && !(isSelected && selectedIds && selectedIds.size > 1)) {
                const snap = findSnapTarget(newX, newY);
                if (snap) {
                    glowDir = snap.side as any;
                    if (snap.side === 'right' || snap.side === 'left') {
                        newGuides.push({ type: 'v', pos: snap.side === 'right' ? snap.x + CARD_WIDTH + SNAP_GAP/2 : snap.x - SNAP_GAP/2 });
                    } else {
                        newGuides.push({ type: 'h', pos: snap.side === 'bottom' ? snap.y + CARD_H + SNAP_GAP/2 : snap.y - SNAP_GAP/2 });
                    }
                }
            }

            setSnapGlow(glowDir);
            if (onSetGuides) onSetGuides(newGuides);

            x.set(newX);
            y.set(newY);

            if (isDraggingRef.current) {
                if (isSelected && selectedIds && selectedIds.size > 1 && onUpdateMultiple) {
                    onUpdateMultiple(newX - dragStartRef.current.ix, newY - dragStartRef.current.iy);
                } else if (onUpdate) {
                    onUpdate({ x: newX, y: newY });
                }
            }
        };

        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);

            if (isDraggingRef.current && dragStartRef.current) {
                let finalX = x.get();
                let finalY = y.get();

                // --- Snap on release ---
                if (!(isSelected && selectedIds && selectedIds.size > 1)) {
                    const snap = findSnapTarget(finalX, finalY);
                    if (snap) {
                        finalX = snap.x;
                        finalY = snap.y;
                        x.set(finalX);
                        y.set(finalY);
                    }
                }

                if (isSelected && selectedIds && selectedIds.size > 1 && onUpdateMultiple) {
                    onUpdateMultiple(finalX - dragStartRef.current.ix, finalY - dragStartRef.current.iy);
                } else if (onUpdate) {
                    onUpdate({ x: finalX, y: finalY });
                }
            }

            isDraggingRef.current = false;
            dragStartRef.current = null;
            setIsDragging(false);
            setSnapGlow(null);
            if (onSetGuides) onSetGuides([]);
            document.body.style.userSelect = '';
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [item, isSelected, onSelect, x, y, canvasScale, allItems, selectedIds, onUpdate, onUpdateMultiple, onSetGuides, CARD_WIDTH, CARD_H]);

    // Glow style based on snap direction
    const glowStyle: React.CSSProperties = {};
    if (snapGlow && isDragging) {
        const glowColor = 'rgba(59, 130, 246, 0.6)';
        const spread = '0 0 12px 3px';
        if (snapGlow === 'right')  glowStyle.boxShadow = `${spread} ${glowColor}, inset -4px 0 8px -4px ${glowColor}`;
        if (snapGlow === 'left')   glowStyle.boxShadow = `${spread} ${glowColor}, inset 4px 0 8px -4px ${glowColor}`;
        if (snapGlow === 'bottom') glowStyle.boxShadow = `${spread} ${glowColor}, inset 0 -4px 8px -4px ${glowColor}`;
        if (snapGlow === 'top')    glowStyle.boxShadow = `${spread} ${glowColor}, inset 0 4px 8px -4px ${glowColor}`;
    }

    return (
        <motion.div
            style={{ x, y, position: 'absolute', touchAction: 'none', ...glowStyle, borderRadius: snapGlow && isDragging ? '12px' : undefined, transition: snapGlow ? 'box-shadow 0.15s ease' : 'none' }}
            animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
            transition={{ scale: { type: 'spring', stiffness: 400, damping: 25 } }}
            onPointerDown={handlePointerDown}
            onMouseDown={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopPropagation();
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopPropagation();
            }}
            className={` ${isDragging ? 'z-30' : 'z-10'} hover:z-20 nodrag ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background rounded-xl' : ''}`}
        >
            <ItemCard 
                item={item} 
                onCopy={handleCopy} 
                onDelete={() => onDeleteItem(item.id)}
                onUpdate={(updates) => onUpdate(updates)}
                isGridView={true}
                isCanvasView={true}
                onAddChild={onAddChild}
                onAddSibling={onAddSibling}
            />
        </motion.div>
    );
};

