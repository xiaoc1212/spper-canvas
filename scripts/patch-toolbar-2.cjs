const fs = require('fs');
const file = 'e:/openhankog工作区/超级画板/--main/components/ContentArea.tsx';
let content = fs.readFileSync(file, 'utf8');

// The smart import button
let smartImportBlock = `<button
                    onClick={() => setIsImporting(true)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-x-1.5 hover:scale-105 hover:brightness-125"
                    style={{ background: '#3b82f622', border: '1.5px solid #3b82f655', boxShadow: '0 4px 12px #3b82f633' }}
                    title="智能导入"
                  >
                    <Sparkles size={18} />
                  </button>`;

let smartImportTarget = `<button
                    onClick={() => setIsImporting(true)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150 bg-transparent hover:bg-[#27272a] text-blue-400 hover:text-blue-300"
                    title="智能导入"
                  >
                    <Sparkles size={20} />
                  </button>`;

if (content.includes(smartImportBlock)) {
    content = content.replace(smartImportBlock, smartImportTarget);
    console.log("Smart Import Button replaced.");
} else {
    console.log("Could not find exact Smart Import Button string.");
}

// The ghost Drag overlay
let ghostDragRegex = /\{\/\* Ghost drag card overlay \*\/\}\s*\{ghostDrag && \(\s*<div className="fixed pointer-events-none z-\[9999\]" style=\{\{ left: ghostDrag\.x \+ 12, top: ghostDrag\.y - 24 \}\}>\s*<motion\.div\s*initial=\{\{ scale: 0\.5, opacity: 0, rotate: -4 \}\}\s*animate=\{\{ scale: 0\.9, opacity: 0\.92, rotate: 3 \}\}\s*transition=\{\{ type: 'spring', stiffness: 500, damping: 28 \}\}\s*className="w-28 rounded-xl shadow-2xl border px-3 py-3 flex flex-col items-center gap-1\.5"[\s\S]*?<\/motion\.div>\s*<\/div>\s*\)\}/;

let ghostDragReplacement = `{/* Ghost drag card overlay */}
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
              )}`;

if (ghostDragRegex.test(content)) {
    content = content.replace(ghostDragRegex, ghostDragReplacement);
    console.log("Ghost drag block replaced.");
} else {
    console.log("Could not find exact Ghost drag regex text.");
}

fs.writeFileSync(file, content);
console.log("Done.");
