import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectGroup, Card, ItemType } from '../types';
import { Copy, Eye, EyeOff, Plus, Trash2, Check, Terminal, Key, Type, Save, LayoutGrid, List, Sparkles, X, ArrowRight, Image as ImageIcon, StickyNote, MousePointer2, Network, Palette, GripVertical, Link2, ExternalLink } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import TextareaAutosize from 'react-textarea-autosize';

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

// ---- Canvas constants ----
const CANVAS_SIZE = 15000;
const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;

/**
 * Milanote-style pan clamping.
 *
 * Rules:
 *  - When the scaled canvas is LARGER than the viewport on an axis,
 *    don't let the user drag past the edge (no blank space visible).
 *  - When the scaled canvas is SMALLER than the viewport on an axis,
 *    lock it to the center (no free panning on that axis).
 */
function clampPan(px: number, py: number, scale: number, vw: number, vh: number) {
  const cw = CANVAS_SIZE * scale;
  const ch = CANVAS_SIZE * scale;

  let x: number, y: number;

  if (cw <= vw) {
    // Canvas fits inside viewport → center it
    x = (vw - cw) / 2;
  } else {
    // Canvas is bigger → allow panning but never reveal blank space
    // position 0 = left edge aligned, position (vw - cw) = right edge aligned
    x = Math.min(0, Math.max(vw - cw, px));
  }

  if (ch <= vh) {
    y = (vh - ch) / 2;
  } else {
    y = Math.min(0, Math.max(vh - ch, py));
  }

  return { x, y };
}



const TOOL_ITEMS: { type: ItemType; icon: any; label: string; color: string }[] = [
  { type: 'note',     icon: StickyNote, label: '笔记',   color: '#eab308' },
  { type: 'text',     icon: Type,       label: '文本',   color: '#3b82f6' },
  { type: 'password', icon: Key,        label: '密码',   color: '#ef4444' },
  { type: 'code',     icon: Terminal,   label: '代码',   color: '#22c55e' },
  { type: 'image',    icon: ImageIcon,  label: '图片',   color: '#a855f7' },
  { type: 'link',     icon: Link2,      label: '链接',   color: '#06b6d4' },
  { type: 'mindmap',  icon: Network,    label: '思维图', color: '#14b8a6' },
];

interface ContentAreaProps {
  group: ProjectGroup | null;
  onAddItem: (item: Card) => void;
  onUpdateItem: (itemId: string, updates: Partial<Card>) => void;
  onDeleteItem: (itemId: string) => void;
}

// --- Smart Import Logic ---
interface ParsedItem {
    label: string;
    value: string;
    type: ItemType;
}

const parseBlobToItems = (text: string): ParsedItem[] => {
    const results: ParsedItem[] = [];
    const seen = new Set<string>();

    try {
        const json = JSON.parse(text);
        if (typeof json === 'object' && json !== null) {
            Object.entries(json).forEach(([key, val]) => {
                if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                    results.push({
                        label: key,
                        value: String(val),
                        type: key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') ? 'password' : 'text'
                    });
                    seen.add(key);
                }
            });
            return results;
        }
    } catch (e) {
    }

    const lines = text.split('\n');
    const keyValRegex = /^\s*(?:export\s+)?(?:["']?)([^=:]+?)(?:["']?)\s*[:=]\s*(.*)$/;

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('//')) continue;

        const match = line.match(keyValRegex);
        if (match) {
            let label = match[1].trim();
            let value = match[2].trim();

            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (value.endsWith(',')) {
                value = value.slice(0, -1);
            }

            if (label && value && !seen.has(label)) {
                 let type: ItemType = 'text';
                 const lowerLabel = label.toLowerCase();
                 if (lowerLabel.includes('key') || lowerLabel.includes('secret') || lowerLabel.includes('password') || lowerLabel.includes('token') || lowerLabel.includes('auth')) {
                     type = 'password';
                 } else if (value.includes(' ') || value.length > 50 || value.includes('\n')) {
                     type = value.startsWith('http') ? 'text' : 'code';
                 }

                 results.push({ label, value, type });
                 seen.add(label);
            }
        }
    }

    return results;
};

// --- Sub Components ---

const ImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: ParsedItem[]) => void;
}> = ({ isOpen, onClose, onImport }) => {
    const [text, setText] = useState('');
    const [preview, setPreview] = useState<ParsedItem[]>([]);

    useEffect(() => {
        if (text) {
            setPreview(parseBlobToItems(text));
        } else {
            setPreview([]);
        }
    }, [text]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onImport(preview);
        setText('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e293b] border border-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles size={20} />
                        <h2 className="font-bold text-white">智能批量导入</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 flex-1 overflow-hidden flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex flex-col min-h-[200px]">
                        <label className="text-xs text-gray-400 mb-2 block">粘贴原始文本 (支持 .env, JSON, Key=Value)</label>
                        <textarea
                            autoFocus
                            className="flex-1 w-full bg-[#0f172a] border border-border rounded-lg p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-primary resize-none"
                            placeholder={`示例:\nDB_HOST=localhost\nAPI_KEY=sk-123456\n# 或者 JSON\n{"APP_ID": "xyz"}`}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    {text && (
                        <div className="md:w-1/2 flex flex-col border-l border-border md:pl-4 mt-4 md:mt-0">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-gray-400">识别预览 ({preview.length})</label>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-[#0f172a]/50 rounded-lg border border-border p-2 space-y-2 max-h-[300px] custom-scrollbar">
                                {preview.length === 0 ? (
                                    <div className="text-gray-500 text-xs text-center py-10">无法识别有效键值对</div>
                                ) : (
                                    preview.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-[#1e293b] p-2 rounded border border-border/50">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-white truncate">{item.label}</div>
                                                <div className="text-[10px] text-gray-400 truncate">{item.type === 'password' ? '••••••' : item.value}</div>
                                            </div>
                                            <span className="text-[10px] uppercase bg-primary/20 text-primary px-1 rounded">{item.type}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3">
                     <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">取消</button>
                     <button 
                        onClick={handleConfirm} 
                        disabled={preview.length === 0}
                        className="flex items-center gap-2 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <span>确认导入</span>
                        <ArrowRight size={16} />
                     </button>
                </div>
            </div>
        </div>
    );
};

const ItemCard: React.FC<{
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
                <div className="bg-gradient-to-br from-[#1e293b]/90 to-[#0f172a]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl shadow-xl shadow-black/20 transition-all text-gray-200">
                    <div className="px-4 py-3 text-[14px] cursor-grab active:cursor-grabbing w-full min-h-[44px] flex items-center justify-center text-center">
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
                            <div onClick={() => setIsEditingContent(true)} className="w-full break-words font-medium">
                                {item.value || <span className="text-gray-500/70 italic font-normal">中心主题</span>}
                            </div>
                        )}
                    </div>
                </div>
                
                {onAddChild && !isEditingContent && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddChild(); }}
                        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/mm:opacity-100 hover:scale-110 hover:bg-teal-400 shadow-lg transition-all z-50 ring-2 ring-[#0f172a] cursor-pointer"
                        title="添加子节点"
                    ><Plus size={14} /></button>
                )}
                {onAddSibling && !isEditingContent && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddSibling(); }}
                        className="absolute left-1/2 -bottom-3.5 -translate-x-1/2 w-6 h-6 bg-blue-500 hover:bg-blue-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover/mm:opacity-100 hover:scale-110 shadow-lg transition-all z-50 ring-2 ring-[#0f172a] cursor-pointer"
                        title="添加同级节点"
                    ><Plus size={14} /></button>
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
                <div className="relative bg-transparent flex items-center justify-center cursor-grab active:cursor-grabbing min-h-[120px]">
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
                        <button onClick={() => setIsEditing(true)} className="p-1.5 text-white/80 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-md transition-colors" title="编辑"><Type size={13} /></button>
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
                <div className="flex items-center justify-between px-3 pt-2 pb-1 cursor-grab active:cursor-grabbing select-none" style={{ color: currentText }}>
                    <div className="flex items-center gap-1.5 overflow-hidden opacity-70">
                        <StickyNote size={13} className="flex-shrink-0" />
                        {item.label && <span className="text-[11px] font-semibold truncate uppercase tracking-wider select-none">{item.label}</span>}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-1 px-1.5 hover:bg-black/10 rounded-sm transition-colors" title="颜色"><Palette size={13} /></button>
                        <button onClick={() => setIsEditing(true)} className="p-1 px-1.5 hover:bg-black/10 rounded-sm transition-colors" title="编辑"><Type size={13} /></button>
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
                            onClick={() => setIsEditingContent(true)}
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
                className={`group ${isCanvasView ? 'w-auto min-w-[300px] max-w-[500px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all relative cursor-grab active:cursor-grabbing`}
            >
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#27272a] border-b border-white/5 select-none">
                    <span className="text-[11px] font-mono font-medium text-gray-400 select-none uppercase tracking-widest">{lang}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleCopy} className={`p-1 rounded-sm transition-colors ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white hover:bg-[#3f3f46]'}`} title="复制">
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white rounded-sm hover:bg-[#3f3f46]" title="编辑"><Type size={13} /></button>
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
                        <div onClick={() => setIsEditingContent(true)}
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
                className={`group ${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all p-4 flex flex-col cursor-grab active:cursor-grabbing relative`}
            >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white rounded-sm hover:bg-[#3f3f46]" title="编辑"><Type size={13} /></button>
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
                        <div onClick={() => setIsEditingContent(true)} className="flex items-center justify-between cursor-text bg-[#27272a] border border-white/5 rounded px-3 py-1.5 group/pwd hover:bg-[#3f3f46] transition-colors">
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
                className={`group ${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all cursor-grab active:cursor-grabbing flex flex-col relative`}
            >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-300 bg-[#27272a] hover:bg-[#3f3f46] border border-white/10 rounded-sm transition-colors" title="编辑"><Type size={13} /></button>
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
            <div className="flex items-center justify-between px-3 py-2 bg-[#27272a] border-b border-white/5 cursor-grab active:cursor-grabbing select-none">
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
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white rounded-sm hover:bg-[#3f3f46]" title="编辑"><Type size={13} /></button>
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
                    <div onClick={() => setIsEditingContent(true)}
                        className={`text-[13px] leading-relaxed text-gray-300 break-words cursor-text ${isGridView ? 'overflow-y-auto max-h-48' : ''}`}
                    >
                        {item.value || <span className="text-gray-600 italic">点击输入文本...</span>}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const DraggableItem = ({ item, isSelected, onSelect, onUpdate, onAddChild, onAddSibling, group, selectedIds, onUpdateMultiple, handleCopy, onDeleteItem, allItems, onSetGuides, canvasScale = 1, onDragStart }: any) => {
    const x = useMotionValue(item.x || 0);
    const y = useMotionValue(item.y || 0);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef<{ mx: number; my: number; ix: number; iy: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const CARD_WIDTH = item.type === 'mindmap' ? 192 : 256;
    const SNAP_THRESHOLD = 5;

    useEffect(() => {
        if (!isDraggingRef.current) {
            x.set(item.x || 0);
            y.set(item.y || 0);
        }
    }, [item.x, item.y, x, y]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Don't start drag from editable content
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

        if (!isSelected) {
            onSelect(item.id, e.shiftKey);
        }
        e.stopPropagation();
        e.nativeEvent.stopPropagation();

        // Start drag tracking
        isDraggingRef.current = false; // not yet - wait for threshold
        dragStartRef.current = { mx: e.clientX, my: e.clientY, ix: x.get(), iy: y.get() };
        if (onDragStart) onDragStart();
        document.body.style.userSelect = 'none';

        const onMove = (ev: PointerEvent) => {
            if (!dragStartRef.current) return;
            const { mx, my, ix, iy } = dragStartRef.current;

            // Divide by canvasScale to compensate for CSS scale transform
            const dx = (ev.clientX - mx) / canvasScale;
            const dy = (ev.clientY - my) / canvasScale;

            // Drag threshold (3px screen space)
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

            // Boundary constraints
            newX = Math.max(0, Math.min(CANVAS_SIZE - CARD_WIDTH, newX));
            newY = Math.max(0, Math.min(CANVAS_SIZE - 200, newY));

            x.set(newX);
            y.set(newY);

            // Sync position to React state in realtime (needed for connection lines & multi-select)
            if (isDraggingRef.current) {
                if (isSelected && selectedIds && selectedIds.size > 1 && onUpdateMultiple) {
                    const totalDx = newX - dragStartRef.current.ix;
                    const totalDy = newY - dragStartRef.current.iy;
                    onUpdateMultiple(totalDx, totalDy);
                } else if (onUpdate) {
                    onUpdate({ x: newX, y: newY });
                }
            }
        };

        const onUp = (ev: PointerEvent) => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);

            // Sync final position to React state ONLY on release
            if (isDraggingRef.current && dragStartRef.current) {
                const finalX = x.get();
                const finalY = y.get();
                if (isSelected && selectedIds && selectedIds.size > 1 && onUpdateMultiple) {
                    const totalDx = finalX - dragStartRef.current.ix;
                    const totalDy = finalY - dragStartRef.current.iy;
                    onUpdateMultiple(totalDx, totalDy);
                } else if (onUpdate) {
                    onUpdate({ x: finalX, y: finalY });
                }
            }

            isDraggingRef.current = false;
            dragStartRef.current = null;
            setIsDragging(false);
            if (onSetGuides) onSetGuides([]);
            document.body.style.userSelect = '';
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [item, isSelected, onSelect, x, y, canvasScale, allItems, selectedIds, onUpdate, onUpdateMultiple, onSetGuides, CARD_WIDTH]);

    return (
        <motion.div
            style={{ x, y, position: 'absolute', touchAction: 'none' }}
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
            className={`${isDragging ? 'z-30' : 'z-10'} hover:z-20 nodrag ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background rounded-xl' : ''}`}
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

export const ContentArea: React.FC<ContentAreaProps> = ({ 
    group, 
    onAddItem, 
    onDeleteItem,
    onUpdateItem
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemType, setNewItemType] = useState<ItemType>('text');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'canvas'>('canvas');
  
  const outerScrollRef = useRef<HTMLDivElement>(null);
  const innerCanvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasScaleRef = useRef(1); // Store latest scale to avoid stale closure in native event listeners
  
  useEffect(() => {
    canvasScaleRef.current = canvasScale;
  }, [canvasScale]);

  const handleZoomCenter = (newScale: number) => {
    const container = outerScrollRef.current;
    if (!container) {
        setCanvasScale(newScale);
        return;
    }

    const { scrollLeft, scrollTop, clientWidth, clientHeight } = container;
    const oldScale = canvasScaleRef.current;
    
    const centerXStart = (scrollLeft + clientWidth / 2) / oldScale;
    const centerYStart = (scrollTop + clientHeight / 2) / oldScale;

    setCanvasScale(newScale);

    requestAnimationFrame(() => {
        if (!outerScrollRef.current) return;
        const targetScrollLeft = centerXStart * newScale - clientWidth / 2;
        const targetScrollTop = centerYStart * newScale - clientHeight / 2;
        
        outerScrollRef.current.scrollLeft = targetScrollLeft;
        outerScrollRef.current.scrollTop = targetScrollTop;
    });
  };


  const [selectionBox, setSelectionBox] = useState<{startX: number, startY: number, endX: number, endY: number} | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [guides, setGuides] = useState<{ type: 'h' | 'v', pos: number }[]>([]);

  // Ghost drag (sidebar drag-to-create)
  const [ghostDrag, setGhostDrag] = useState<{ type: ItemType; x: number; y: number } | null>(null);
  const ghostDragTypeRef = useRef<ItemType | null>(null);

  // Canvas interaction refs
  const draggedOriginsRef = useRef<Record<string, {x: number, y: number}>>({});
  const pointerDownOnCanvasRef = useRef(false);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isBoxSelectingRef = useRef(false);

  // Pan state
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const spaceHeldRef = useRef(false);

  // Keep group in a ref for access in native event listeners (avoid stale closures)
  const groupRef = useRef(group);
  useEffect(() => { groupRef.current = group; }, [group]);

  // Initial center position
  useEffect(() => {
    if (viewMode === 'canvas') {
      const timer = setTimeout(() => {
        if (outerScrollRef.current) {
          const container = outerScrollRef.current;
          container.scrollLeft = (CANVAS_SIZE * canvasScaleRef.current - container.clientWidth) / 2;
          container.scrollTop = (CANVAS_SIZE * canvasScaleRef.current - container.clientHeight) / 2;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Global delete shortcut for selected items
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return; 
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
         if (selectedIds.size > 0 && viewMode === 'canvas') {
            selectedIds.forEach(id => onDeleteItem(id));
            setSelectedIds(new Set()); 
         }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, viewMode, onDeleteItem]);


  useEffect(() => {
    setIsAdding(false);
    setNewItemLabel('');
    setNewItemValue('');
    setSelectedIds(new Set());
  }, [group?.id]);

  useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
          if (viewMode !== 'canvas') return;
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
          const items = e.clipboardData?.items;
          if (!items) return;
          for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf('image') !== -1) {
                  const blob = items[i].getAsFile();
                  if (blob) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                          const base64 = ev.target?.result as string;
                          let x = 100, y = 100;
                          if (outerScrollRef.current) {
                              const rect = outerScrollRef.current.getBoundingClientRect();
                              x = (rect.width / 2 + outerScrollRef.current.scrollLeft) / canvasScale - 128;
                              y = (rect.height / 2 + outerScrollRef.current.scrollTop) / canvasScale - 100;
                          }
                          onAddItem({ id: crypto.randomUUID(), label: '', value: base64, type: 'image', x, y });
                      };
                      reader.readAsDataURL(blob);
                  }
                  break;
              }
          }
      };
      window.addEventListener('paste', handlePaste);
      return () => window.removeEventListener('paste', handlePaste);
  }, [viewMode, onAddItem]);



  // Global mouse: pan + ghost drag drop + box select
  useEffect(() => {
    if (viewMode !== 'canvas') return;
    const container = outerScrollRef.current;
    if (!container) return;

    const getTransform = () => {
      // In our native scroll system, positionX is the negative scrollLeft
      return { positionX: -container.scrollLeft, positionY: -container.scrollTop, scale: canvasScaleRef.current };
    };

    const isOnCard = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return !!target.closest('.nodrag');
    };

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as Element).closest('.toolbar-container')) return;
      if (ghostDragTypeRef.current) return;
      if (e.button !== 0 && e.button !== 1) return;
      if (isOnCard(e.target)) return;

      // Space + Left Click OR Middle Click = Pan
      if (e.button === 1 || (e.button === 0 && spaceHeldRef.current)) {
        e.preventDefault();
        isPanningRef.current = true;
        panStartRef.current = { mx: e.clientX, my: e.clientY, px: container.scrollLeft, py: container.scrollTop };
        container.style.cursor = 'grabbing';
        return;
      }

      // Default Left Click = Box Select
      if (e.button === 0) {
        if (!e.shiftKey) {
          setSelectedIds(new Set());
        }
        setIsAdding(false);
        const rect = container.getBoundingClientRect();
        const { positionX, positionY, scale } = getTransform();
        const x = (e.clientX - rect.left - positionX) / scale;
        const y = (e.clientY - rect.top - positionY) / scale;
        pointerDownPosRef.current = { x, y };
        pointerDownOnCanvasRef.current = true;
        
        // Prevent accidental text selection everywhere while initiating a potential drag
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = 'none';
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (ghostDragTypeRef.current) {
        setGhostDrag(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      }

      // Native Panning by modifying scrollLeft
      if (isPanningRef.current && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.mx;
        const dy = e.clientY - panStartRef.current.my;
        container.scrollLeft = panStartRef.current.px - dx;
        container.scrollTop = panStartRef.current.py - dy;
        return;
      }

      // Box select
      if (pointerDownOnCanvasRef.current && pointerDownPosRef.current) {
        const rect = container.getBoundingClientRect();
        const { positionX, positionY, scale } = getTransform();
        const x = (e.clientX - rect.left - positionX) / scale;
        const y = (e.clientY - rect.top - positionY) / scale;
        const { x: sx, y: sy } = pointerDownPosRef.current;
        if (!isBoxSelectingRef.current) {
          if (Math.hypot(x - sx, y - sy) > 5) { 
              isBoxSelectingRef.current = true; 
              setSelectionBox({ startX: sx, startY: sy, endX: x, endY: y }); 
              document.body.style.userSelect = 'none'; 
          }
        } else {
          setSelectionBox(prev => prev ? { ...prev, endX: x, endY: y } : null);
          const minX = Math.min(sx, x), maxX = Math.max(sx, x), minY = Math.min(sy, y), maxY = Math.max(sy, y);
          const ns = new Set<string>();
          groupRef.current?.items.forEach(item => { const ix = item.x || 0, iy = item.y || 0; if (ix < maxX && ix + 256 > minX && iy < maxY && iy + 100 > minY) ns.add(item.id); });
          setSelectedIds(ns);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (ghostDragTypeRef.current) {
        const rect = container.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const { positionX, positionY, scale } = getTransform();
          const cx = (e.clientX - rect.left - positionX) / scale;
          const cy = (e.clientY - rect.top - positionY) / scale;
          onAddItem({ id: crypto.randomUUID(), label: ghostDragTypeRef.current === 'mindmap' ? '中心主题' : '', value: '', type: ghostDragTypeRef.current!, x: cx - 128, y: cy - 50, isNew: true });
        }
        ghostDragTypeRef.current = null;
        setGhostDrag(null);
      }

      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        container.style.cursor = '';
      }

      if (pointerDownOnCanvasRef.current) {
        if (!isBoxSelectingRef.current) setSelectedIds(new Set());
        pointerDownOnCanvasRef.current = false;
        pointerDownPosRef.current = null;
        isBoxSelectingRef.current = false;
        setSelectionBox(null);
        document.body.style.userSelect = '';
      }
    };

    const onWheel = (e: WheelEvent) => {
      // ONLY intercept if Ctrl/Cmd is down (Zooming). 
      // Ordinary wheel scroll natively pans the container!
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1; // Smooth 10% zoom steps
        setCanvasScale(currentScale => {
          const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale * factor));
          if (newScale !== currentScale) {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Calculate point under mouse before zoom
            const focusX = (mouseX + container.scrollLeft) / currentScale;
            const focusY = (mouseY + container.scrollTop) / currentScale;
            
            // Apply new scroll required to anchor that focus point under mouse
            Promise.resolve().then(() => {
                container.scrollLeft = focusX * newScale - mouseX;
                container.scrollTop = focusY * newScale - mouseY;
            });
          }
          return newScale;
        });
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const t = e.target as HTMLElement;
        // ignore if typing in input
        if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable) return;
        if (!spaceHeldRef.current) {
           spaceHeldRef.current = true;
           container.style.cursor = 'grab';
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        container.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [viewMode, onAddItem]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Handled by native event listener above
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    // Handled by native event listener above
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    // Handled by native event listener above
  };

  if (!group) {
    return (
      <div className="flex-1 h-full bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface mb-6">
                <Terminal size={32} className="text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-300 mb-2">欢迎使用 ConfigVault</h1>
            <p className="text-gray-500 mb-8">请从左侧选择一个项目和分组，以查看或管理您的配置密钥。</p>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleQuickAdd = (type: ItemType) => {
      let x = 100, y = 100;
      if (outerScrollRef.current) {
          const rect = outerScrollRef.current.getBoundingClientRect();
          x = (rect.width / 2 + outerScrollRef.current.scrollLeft) / canvasScale - 128;
          y = (rect.height / 2 + outerScrollRef.current.scrollTop) / canvasScale - 100;
      }
      onAddItem({ id: crypto.randomUUID(), label: type === 'mindmap' ? '中心主题' : '', value: '', type, x, y, isNew: true });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemType !== 'image' || newItemValue) {
      let x = 100, y = 100;
      if (viewMode === 'canvas' && outerScrollRef.current) {
          const rect = outerScrollRef.current.getBoundingClientRect();
          x = (rect.width / 2 + outerScrollRef.current.scrollLeft) / canvasScale - 128;
          y = (rect.height / 2 + outerScrollRef.current.scrollTop) / canvasScale - 100;
      }
      onAddItem({ id: crypto.randomUUID(), label: newItemLabel, value: newItemValue, type: newItemType, x, y });
      setNewItemLabel('');
      setNewItemValue('');
      setIsAdding(false);
    }
  };

  const handleSmartImport = (items: ParsedItem[]) => {
      items.forEach((item, idx) => {
          onAddItem({
              id: crypto.randomUUID(),
              label: item.label,
              value: item.value,
              type: item.type,
              x: 100 + (idx * 20),
              y: 100 + (idx * 20)
          });
      });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setNewItemValue(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-background relative">
      <ImportModal 
        isOpen={isImporting} 
        onClose={() => setIsImporting(false)} 
        onImport={handleSmartImport}
      />

      {/* Header */}
      <div className="p-6 pb-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 gap-4 select-none">
        <div className="flex-1 overflow-hidden">
           <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest mb-1">
                <span>配置列表</span>
                <span>/</span>
                <span className="text-primary truncate">{group.name}</span>
           </div>
           <h1 className="text-xl font-bold text-white truncate">{group.name}</h1>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Toggle */}
            <div className="bg-surface border border-border rounded-lg p-1 flex items-center hidden sm:flex">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    title="列表视图"
                >
                    <List size={18} />
                </button>
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
                onClick={() => setIsImporting(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-surface hover:bg-white/10 text-primary border border-primary/20 transition-all"
                title="智能导入"
            >
                <Sparkles size={18} />
                <span className="hidden sm:inline">智能导入</span>
            </button>

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
                        <span className="hidden sm:inline">新建</span>
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Workspace Wrapper for Fixed UIs */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Left-side Milanote-style drag-to-create toolbar */}
        {viewMode === 'canvas' && (
            <>
              <div className="toolbar-container absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 bg-[#18181b] border border-white/10 p-2 rounded-xl shadow-[4px_0_24px_rgba(0,0,0,0.5)] select-none">
                {TOOL_ITEMS.map(({ type, icon: Icon, label, color }) => (
                  <div key={type} className="group relative"
                    onMouseDown={(e) => {
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
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent" style={{ borderRightColor: '#27272a' }} />
                    </div>
                  </div>
                ))}
                <div className="w-6 h-px bg-white/10 my-1" />
                <div className="group relative">
                  <button
                    onClick={() => setIsImporting(true)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-x-1.5 hover:scale-105 hover:brightness-125"
                    style={{ background: '#3b82f622', border: '1.5px solid #3b82f655', boxShadow: '0 4px 12px #3b82f633' }}
                    title="智能导入"
                  >
                    <Sparkles size={18} />
                  </button>
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-[#27272a] border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                    智能导入
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent" style={{ borderRightColor: '#27272a' }} />
                  </div>
                </div>
              </div>

              {/* Ghost drag card overlay */}
              {ghostDrag && (
                <div className="fixed pointer-events-none z-[9999]" style={{ left: ghostDrag.x + 12, top: ghostDrag.y - 24 }}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="w-28 rounded-lg shadow-xl border px-3 py-3 flex flex-col items-center gap-1.5 bg-[#27272a] border-white/10"
                  >
                    {(() => { const t = TOOL_ITEMS.find(i => i.type === ghostDrag.type); const Icon = t?.icon || Type; return <Icon size={20} className="text-gray-300" />; })()}
                    <span className="text-xs text-gray-300 font-medium">{TOOL_ITEMS.find(i => i.type === ghostDrag.type)?.label}</span>
                  </motion.div>
                </div>
              )}
              
              {/* Zoom Controls */}
              <div className="absolute right-6 bottom-6 z-50 flex items-center gap-1 bg-[#18181b] border border-white/10 p-1.5 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
                <button 
                   onClick={() => handleZoomCenter(Math.max(MIN_SCALE, canvasScale - 0.1))}
                   className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#27272a] text-gray-400 hover:text-gray-100 transition-colors text-lg"
                   title="缩小"
                >−</button>
                <div 
                   className="w-14 text-center text-[13px] font-medium text-gray-400 hover:bg-[#27272a] py-1 rounded-lg cursor-pointer hover:text-gray-200 transition-colors" 
                   onClick={() => handleZoomCenter(1)}
                   title="恢复100%"
                >
                  {Math.round(canvasScale * 100)}%
                </div>
                <button 
                   onClick={() => handleZoomCenter(Math.min(MAX_SCALE, canvasScale + 0.1))}
                   className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#27272a] text-gray-400 hover:text-gray-100 transition-colors text-lg"
                   title="放大"
                >+</button>
              </div>
            </>
        )}

        

        {/* Content Area */}
      <div 
        className={`flex-1 relative ${viewMode === 'canvas' ? 'overflow-auto custom-scrollbar-mac' : 'overflow-y-auto p-6 custom-scrollbar-mac'}`} 
        ref={outerScrollRef}
        onPointerDown={(e) => {
            if (viewMode !== 'canvas' && e.target === e.currentTarget) {
                setIsAdding(false);
            }
        }}
      >
        
        {/* Add Form (Static otherwise) */}
        {isAdding && viewMode !== 'canvas' && (
          <div className="mb-6">
            <form onSubmit={handleAddItem} className="bg-surface border border-primary border-dashed rounded-lg p-4 animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-3">
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-gray-500 mb-1">名称 (可选)</label>
                        <input 
                            autoFocus
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            placeholder="例如：DATABASE_URL"
                            value={newItemLabel}
                            onChange={e => setNewItemLabel(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="mb-3">
                    <label className="block text-xs text-gray-500 mb-1">类型</label>
                    <div className="flex flex-wrap bg-background border border-border rounded p-1 gap-1">
                        {(['text', 'password', 'code', 'image', 'note', 'mindmap'] as ItemType[]).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => { setNewItemType(t); setNewItemValue(''); }}
                                className={`flex-1 min-w-[60px] text-xs py-1.5 rounded capitalize ${newItemType === t ? 'bg-surface text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">内容</label>
                    {newItemType === 'image' ? (
                        <div className="flex flex-col gap-2">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                            />
                            <div className="text-xs text-gray-500 text-center my-1">或</div>
                            <input 
                                type="url"
                                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                placeholder="输入图片 URL"
                                value={newItemValue}
                                onChange={e => setNewItemValue(e.target.value)}
                            />
                            {newItemValue && <img src={newItemValue} alt="Preview" className="h-24 object-contain mt-2 rounded bg-black/20" />}
                        </div>
                    ) : newItemType === 'mindmap' ? (
                        <textarea 
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono h-20 focus:border-primary focus:outline-none resize-none"
                            placeholder="输入节点内容（可选）"
                            value={newItemValue}
                            onChange={e => setNewItemValue(e.target.value)}
                        />
                    ) : (
                        <textarea 
                            required
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono h-20 focus:border-primary focus:outline-none resize-none"
                            placeholder={newItemType === 'note' ? "在此输入笔记内容..." : "在此输入密钥值或代码片段..."}
                            value={newItemValue}
                            onChange={e => setNewItemValue(e.target.value)}
                        />
                    )}
                </div>

                <div className="flex justify-end">
                    <button type="submit" className="bg-primary hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors" disabled={!newItemValue && newItemType === 'image' && newItemType !== 'mindmap'}>
                        添加
                    </button>
                </div>
            </form>
          </div>
        )}

        {/* Canvas View */}
        {viewMode === 'canvas' ? (
            <div 
                ref={innerCanvasRef}
                className="relative"
                style={{
                    width: CANVAS_SIZE * canvasScale,
                    height: CANVAS_SIZE * canvasScale,
                    backgroundColor: '#0f172a'
                }}
            >
                <motion.div
                    id="canvas-bg"
                    className="absolute left-0 top-0 origin-top-left flex-none"
                    style={{ 
                        width: CANVAS_SIZE, 
                        height: CANVAS_SIZE, 
                        scale: canvasScale,
                        backgroundImage: 'radial-gradient(#334155 1.5px, transparent 1.5px)', 
                        backgroundSize: '32px 32px' 
                    }}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                >
                        {/* SVG Connection Lines */}
                        <svg className="absolute left-0 top-0 pointer-events-none" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, zIndex: 0 }}>
                            {group.items.filter(i => i.parentId && i.type === 'mindmap').map(child => {
                                const parent = group.items.find(p => p.id === child.parentId && p.type === 'mindmap');
                                if (!parent) return null;
                                const parentW = parent.type === 'mindmap' ? 192 : 256;
                                const childW = child.type === 'mindmap' ? 192 : 256;
                                // For mindmap style, height is usually around 40px (min-h-[40px])
                                const parentH = parent.type === 'mindmap' ? 40 : 80;
                                const childH = child.type === 'mindmap' ? 40 : 80;
                                const startX = (parent.x || 0) + parentW;
                                const startY = (parent.y || 0) + parentH / 2;
                                const endX = child.x || 0;
                                const endY = (child.y || 0) + childH / 2;
                                
                                // UE5 style solid white line
                                // Control points adjusted for visual flow
                                const distance = Math.abs(endX - startX);
                                const cpXOff = Math.max(distance * 0.5, 40);
                                const cpStartX = startX + cpXOff;
                                const cpEndX = endX - cpXOff;
                                
                                return (
                                    <path
                                        key={`link-${parent.id}-${child.id}`}
                                        d={`M ${startX} ${startY} C ${cpStartX} ${startY}, ${cpEndX} ${endY}, ${endX} ${endY}`}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth="2.5"
                                        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
                                    />
                                );
                            })}
                        </svg>
                        

                        {selectionBox && (
                            <div 
                                style={{
                                    position: 'absolute',
                                    left: Math.min(selectionBox.startX, selectionBox.endX),
                                    top: Math.min(selectionBox.startY, selectionBox.endY),
                                    width: Math.abs(selectionBox.endX - selectionBox.startX),
                                    height: Math.abs(selectionBox.endY - selectionBox.startY),
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.5)',
                                    zIndex: 40,
                                    pointerEvents: 'none'
                                }}
                            />
                        )}
                        {guides.map((guide, i) => (
                            <div 
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: guide.type === 'v' ? guide.pos : 0,
                                    top: guide.type === 'h' ? guide.pos : 0,
                                    width: guide.type === 'v' ? 1 : '4000px',
                                    height: guide.type === 'h' ? 1 : '4000px',
                                    backgroundColor: '#3b82f6',
                                    zIndex: 50,
                                    pointerEvents: 'none'
                                }}
                            />
                        ))}
                        {group.items.map(item => {
                            const isSelected = selectedIds.has(item.id);

                            return (
                                <DraggableItem
                                    key={item.id}
                                    item={item}
                                    isSelected={isSelected}
                                    onSelect={(id, shiftKey) => {
                                        if (shiftKey) {
                                            setSelectedIds(prev => {
                                                const next = new Set(prev);
                                                if (next.has(id)) next.delete(id);
                                                else next.add(id);
                                                return next;
                                            });
                                        } else {
                                            setSelectedIds(new Set([id]));
                                        }
                                    }}
                                    onUpdate={(updates) => onUpdateItem(item.id, updates)}
                                    onAddChild={() => {
                                        const newId = crypto.randomUUID();
                                        // Count existing children to stagger Y position
                                        const existingChildren = group.items.filter(i => i.parentId === item.id);
                                        const yOffset = existingChildren.length * 60;
                                        onAddItem({
                                            id: newId,
                                            label: "",
                                            value: "新节点",
                                            type: item.type === 'mindmap' ? 'mindmap' : 'note',
                                            parentId: item.id,
                                            x: (item.x || 0) + 250,
                                            y: (item.y || 0) + yOffset
                                        });
                                        setSelectedIds(new Set([newId]));
                                    }}
                                    onAddSibling={() => {
                                        const newId = crypto.randomUUID();
                                        // Find children of same parent to stack below them
                                        const siblings = group.items.filter(i => i.parentId === item.parentId);
                                        const yOffset = siblings.length * 60;
                                        // Use parent's y for base offset, or item's y if no parent
                                        let baseY = item.y || 0;
                                        let baseX = item.x || 0;
                                        if (item.parentId) {
                                            const parent = group.items.find(p => p.id === item.parentId);
                                            if (parent) {
                                                baseY = parent.y || 0;
                                            }
                                        } else {
                                             baseY = (item.y || 0) + 60; // Just put below if it's root
                                        }
                                        
                                        onAddItem({
                                            id: newId,
                                            label: "",
                                            value: "新节点",
                                            type: item.type === 'mindmap' ? 'mindmap' : 'note',
                                            parentId: item.parentId, // same parent
                                            x: baseX,
                                            y: baseY + yOffset
                                        });
                                        setSelectedIds(new Set([newId]));
                                    }}
                                    group={group}
                                    selectedIds={selectedIds}
                                    onDragStart={() => {
                                        const origins: Record<string, {x: number, y: number}> = {};
                                        selectedIds.forEach(sid => {
                                            const it = group.items.find(i => i.id === sid);
                                            if (it) origins[sid] = { x: it.x || 0, y: it.y || 0 };
                                        });
                                        draggedOriginsRef.current = origins;
                                    }}
                                    onUpdateMultiple={(totalDx, totalDy) => {
                                        selectedIds.forEach(id => {
                                            const orig = draggedOriginsRef.current[id];
                                            if (orig) {
                                                onUpdateItem(id, { x: orig.x + totalDx, y: orig.y + totalDy });
                                            }
                                        });
                                    }}
                                    handleCopy={handleCopy}
                                    onDeleteItem={onDeleteItem}
                                    allItems={group.items}
                                    onSetGuides={setGuides}
                                    canvasScale={canvasScale}
                                />
                            );
                        })}
                    </motion.div>
            </div>
        ) : (
            /* List / Grid View */
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-2"}>
                {group.items.length === 0 && !isAdding && (
                    <div className={`flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-border rounded-xl ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
                        <Key size={32} className="mb-3 opacity-20" />
                        <p>此分组暂无内容。</p>
                    </div>
                )}
                
                {group.items.map(item => (
                    <ItemCard 
                        key={item.id} 
                        item={item} 
                        onCopy={handleCopy} 
                        onDelete={() => onDeleteItem(item.id)}
                        onUpdate={(updates) => onUpdateItem(item.id, updates)}
                        isGridView={viewMode === 'grid'}
                    />
                ))}
            </div>
        )}
      </div>
      </div>
    </div>
  );
};
