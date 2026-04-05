const fs = require('fs');
const file = 'e:/openhankog工作区/超级画板/--main/components/ContentArea.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Mindmap Node
const mindmapOld = `    // ========== MINDMAP NODE ==========
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
    }`;

const mindmapNew = `    // ========== MINDMAP NODE ==========
    if (item.type === 'mindmap' && isCanvasView) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="relative group/mm min-w-[200px]"
            >
                <div className="bg-[#18181b] border border-white/20 hover:border-white/40 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-colors text-gray-200">
                    <div className="px-4 py-2 text-[14px] cursor-grab active:cursor-grabbing w-full flex items-center justify-center text-center">
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
                            <div onClick={() => setIsEditingContent(true)} className="w-full break-words font-semibold text-gray-200">
                                {item.value || <span className="text-gray-500 italic font-normal">中心主题</span>}
                            </div>
                        )}
                    </div>
                </div>
                
                {onAddChild && !isEditingContent && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddChild(); }}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#27272a] border border-white/20 text-gray-300 hover:text-white rounded flex items-center justify-center opacity-0 group-hover/mm:opacity-100 hover:bg-[#3f3f46] shadow-md transition-all z-50 cursor-pointer"
                        title="添加子节点"
                    ><Plus size={14} /></button>
                )}
                {onAddSibling && !isEditingContent && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddSibling(); }}
                        className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-6 h-6 bg-[#27272a] border border-white/20 text-gray-300 hover:text-white rounded flex items-center justify-center opacity-0 group-hover/mm:opacity-100 hover:bg-[#3f3f46] shadow-md transition-all z-50 cursor-pointer"
                        title="添加同级节点"
                    ><Plus size={14} /></button>
                )}
                <div className="absolute top-[-8px] right-[-8px] opacity-0 group-hover/mm:opacity-100 transition-opacity z-50">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1 px-1 text-gray-400 bg-[#27272a] border border-white/10 hover:text-red-400 rounded-sm shadow-md cursor-pointer transition-colors"
                        title="删除"
                    ><X size={12} /></button>
                </div>
            </motion.div>
        );
    }`;

content = content.replace(mindmapOld, mindmapNew);


const imageOld = `    // ========== IMAGE CARD ==========
    if (item.type === 'image') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={\`group \${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} rounded-2xl overflow-hidden transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 hover:border-white/20 relative\`}
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
    }`;

const imageNew = `    // ========== IMAGE CARD ==========
    if (item.type === 'image') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={\`group \${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} rounded-md overflow-hidden transition-all shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] bg-[#18181b] border border-white/10 hover:border-white/30 relative\`}
            >
                <div className="relative bg-[#18181b] flex flex-col items-center justify-center cursor-grab active:cursor-grabbing min-h-[120px]">
                    {item.value ? (
                        <div className="relative w-full h-auto bg-[#18181b]">
                            <img src={item.value} alt={item.label} className="w-full h-auto object-cover block ring-1 ring-white/5" referrerPolicy="no-referrer" />
                        </div>
                    ) : (
                        <div className="py-10 flex flex-col w-full items-center gap-2 text-gray-600">
                            <ImageIcon size={28} className="opacity-40" />
                            <span className="text-[12px] select-none">未配置图片</span>
                        </div>
                    )}
                    {item.label && <div className="w-full bg-[#18181b] border-t border-white/5 py-2 px-3 text-[13px] text-gray-300 truncate">{item.label}</div>}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => setIsEditing(true)} className="p-1 px-1.5 text-gray-300 bg-[#27272a] hover:bg-[#3f3f46] border border-white/10 shadow-sm rounded-sm transition-colors" title="编辑"><Type size={13} /></button>
                        <button onClick={onDelete} className="p-1 px-1.5 text-red-400 bg-[#27272a] hover:bg-[#3f3f46] border border-white/10 shadow-sm rounded-sm transition-colors" title="删除"><Trash2 size={13} /></button>
                    </div>
                </div>
            </motion.div>
        );
    }`;

content = content.replace(imageOld, imageNew);

fs.writeFileSync(file, content);
console.log("Card replacements done part 1.");
