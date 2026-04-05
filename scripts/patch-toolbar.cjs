const fs = require('fs');
const file = 'e:/openhankog工作区/超级画板/--main/components/ContentArea.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  // 1. Toolbar Container
  {
    from: 'className="toolbar-container absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl shadow-2xl select-none ring-1 ring-white/5"',
    to: 'className="toolbar-container absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 bg-[#18181b] border border-white/10 p-2 rounded-xl shadow-[4px_0_24px_rgba(0,0,0,0.5)] select-none"'
  },
  // 2. Toolbar Item
  {
    from: 'className="w-11 h-11 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 hover:-translate-x-1.5 hover:scale-105 hover:brightness-125"\n                      style={{ background: `${color}22`, border: `1.5px solid ${color}55`, boxShadow: `0 4px 12px ${color}33` }}',
    to: 'className="w-10 h-10 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-150 bg-transparent hover:bg-[#27272a] text-gray-400 hover:text-white"'
  },
  {
    from: '<Icon size={18} style={{ color }} />',
    to: '<Icon size={20} />'
  },
  // 3. Toolbar Item Popup
  {
    from: 'className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 bg-[#1e293b] border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-50 transform group-hover:translate-x-1"',
    to: 'className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-[#27272a] border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50"'
  },
  {
    from: 'style={{ borderRightColor: \'#1e293b\' }}',
    to: 'style={{ borderRightColor: \'#27272a\' }}'
  },
  // 4. Toolbar Divider
  {
    from: '<div className="w-8 h-px bg-white/10 my-2" />',
    to: '<div className="w-6 h-px bg-white/10 my-1" />'
  },
  // 5. Smart Import Button
  {
    from: 'className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-x-1.5 hover:scale-105 hover:brightness-125"\n                    style={{ background: \'#3b82f622\', border: \'1.5px solid #3b82f655\', boxShadow: \'0 4px 12px #3b82f633\' }}',
    to: 'className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150 bg-transparent hover:bg-[#27272a] text-blue-400 hover:text-blue-300"'
  },
  {
    from: '<Sparkles size={18} className="text-primary" />',
    to: '<Sparkles size={18} />'
  },
  // 6. zoom controls 
  {
    from: 'className="absolute right-6 bottom-6 z-50 flex items-center gap-1.5 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl shadow-2xl select-none ring-1 ring-white/5"',
    to: 'className="absolute right-6 bottom-6 z-50 flex items-center gap-1 bg-[#18181b] border border-white/10 p-1.5 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none"'
  },
  {
    from: /className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white\/10 text-gray-400 hover:text-white transition-colors text-lg"/g,
    to: 'className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#27272a] text-gray-400 hover:text-gray-100 transition-colors text-lg"'
  },
  {
    from: 'className="w-14 text-center text-xs font-bold text-gray-300 font-mono cursor-pointer hover:text-white"',
    to: 'className="w-14 text-center text-[13px] font-medium text-gray-400 hover:bg-[#27272a] py-1 rounded-lg cursor-pointer hover:text-gray-200 transition-colors"'
  },
  // Ghost Drag Card
  {
     from: 'className="w-28 rounded-xl shadow-2xl border px-3 py-3 flex flex-col items-center gap-1.5"\n                    style={{\n                      background: `${TYPE_ACCENT[ghostDrag.type] || \'#3b82f6\'}18`,\n                      borderColor: `${TYPE_ACCENT[ghostDrag.type] || \'#3b82f6\'}60`,\n                      backdropFilter: \'blur(8px)\',\n                    }}',
     to: 'className="w-28 rounded-lg shadow-xl border px-3 py-3 flex flex-col items-center gap-1.5 bg-[#27272a] border-white/10"'
  },
  {
     from: 'const Icon = t?.icon || Type; return <Icon size={20} style={{ color: t?.color }} />;',
     to: 'const Icon = t?.icon || Type; return <Icon size={20} className="text-gray-400" />;'
  }
];

let replacedCount = 0;
replacements.forEach(r => {
  if (typeof r.from === 'string') {
    if (content.includes(r.from)) {
      content = content.replaceAll(r.from, r.to);
      replacedCount++;
    } else {
        console.log(`Failed to find string: ${r.from}`);
    }
  } else {
      content = content.replace(r.from, r.to);
      replacedCount++;
  }
});

fs.writeFileSync(file, content);
console.log(`Replaced ${replacedCount} elements successfully.`);
