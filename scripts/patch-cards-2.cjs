const fs = require('fs');
const file = 'e:/openhankog工作区/超级画板/--main/components/ContentArea.tsx';
let content = fs.readFileSync(file, 'utf8');

const noteRegex = /\s*\/\/ ========== NOTE CARD ==========[\s\S]*?(?=\s*\/\/ ========== CODE CARD ==========)/;
const codeRegex = /\s*\/\/ ========== CODE CARD ==========[\s\S]*?(?=\s*\/\/ ========== PASSWORD CARD ==========)/;
const passRegex = /\s*\/\/ ========== PASSWORD CARD ==========[\s\S]*?(?=\s*\/\/ ========== LINK CARD ==========)/;
const linkRegex = /\s*\/\/ ========== LINK CARD ==========[\s\S]*?(?=\s*\/\/ ========== TEXT CARD ==========)/;
const textRegex = /\s*\/\/ ========== TEXT CARD ==========[\s\S]*?(?=\s*\}\s*)$/m; // Adjusting end for text card, wait, it goes to the end of ItemCard

const noteNew = `
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
                className={\`group \${isCanvasView ? 'w-[260px]' : isGridView ? 'h-full' : 'mb-3'} rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all relative\`}
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
                                className={\`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110 \${noteColorIdx === i ? 'ring-2 ring-black/30' : ''}\`}
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
                            className={\`text-[14px] leading-relaxed whitespace-pre-wrap cursor-text min-h-[120px] \${isGridView ? 'overflow-y-auto max-h-48' : ''}\`}
                            style={{ color: currentText }}
                        >
                            {item.value || <span className="opacity-40 italic">点击输入内容...</span>}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }`;

const codeNew = `
    // ========== CODE CARD ==========
    if (item.type === 'code') {
        const lang = item.label || 'javascript';
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={\`group \${isCanvasView ? 'w-auto min-w-[300px] max-w-[500px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all relative cursor-grab active:cursor-grabbing\`}
            >
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#27272a] border-b border-white/5 select-none">
                    <span className="text-[11px] font-mono font-medium text-gray-400 select-none uppercase tracking-widest">{lang}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleCopy} className={\`p-1 rounded-sm transition-colors \${copied ? 'text-green-400' : 'text-gray-400 hover:text-white hover:bg-[#3f3f46]'}\`} title="复制">
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
                            className={\`text-[13px] text-gray-300 font-mono whitespace-pre cursor-text min-h-[40px] selection:bg-blue-500/30 \${isGridView ? 'overflow-y-auto max-h-48' : ''}\`}
                        >
                            {item.value || <span className="text-gray-600 italic select-none">点击输入代码...</span>}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }`;

const passNew = `
    // ========== PASSWORD CARD ==========
    if (item.type === 'password') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={\`group \${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all p-4 flex flex-col cursor-grab active:cursor-grabbing relative\`}
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
                                <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className={\`p-1 rounded-sm hover:bg-[#3f3f46] \${copied ? 'text-green-400' : 'text-gray-400 hover:text-white'}\`} title="复制">
                                    {copied ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }`;

const linkNew = `
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
                className={\`group \${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all cursor-grab active:cursor-grabbing flex flex-col relative\`}
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
    }`;

// Replace text card up to the end of the return statement
content = content.replace(noteRegex, noteNew);
content = content.replace(codeRegex, codeNew);
content = content.replace(passRegex, passNew);
content = content.replace(linkRegex, linkNew);

const textOldRegex = /\/\/ ========== TEXT CARD ==========[^\{]*return\s*\([^;]*\);\s*\}/;

const textNewStr = `// ========== TEXT CARD ==========
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className={\`group \${isCanvasView ? 'w-[280px]' : isGridView ? 'h-full' : 'mb-3'} bg-[#18181b] border border-white/10 hover:border-white/30 rounded-md overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all flex flex-col\`}
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
                    <button onClick={handleCopy} className={\`p-1 rounded-sm transition-colors \${copied ? 'text-green-400' : 'text-gray-400 hover:text-white hover:bg-[#3f3f46]'}\`} title="复制">
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
                        className={\`text-[13px] leading-relaxed text-gray-300 break-words cursor-text \${isGridView ? 'overflow-y-auto max-h-48' : ''}\`}
                    >
                        {item.value || <span className="text-gray-600 italic">点击输入文本...</span>}
                    </div>
                )}
            </div>
        </motion.div>
    );
}`;

content = content.replace(textOldRegex, textNewStr);

fs.writeFileSync(file, content);
console.log("Card replacements done part 2.");
