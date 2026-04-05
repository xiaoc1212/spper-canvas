import fs from 'fs';
const file = 'e:/openhankog工作区/超级画板/--main/components/ContentArea.tsx';
let code = fs.readFileSync(file, 'utf8');

const uiStartStr = '{/* Left-side Milanote-style drag-to-create toolbar */}';
const uiEndStr = '{/* Add Form (Static otherwise) */}';

const uiStartIndex = code.indexOf(uiStartStr);
const uiEndIndex = code.indexOf(uiEndStr);

if (uiStartIndex > -1 && uiEndIndex > -1) {
  const uiCode = code.substring(uiStartIndex, uiEndIndex);
  code = code.slice(0, uiStartIndex) + code.slice(uiEndIndex);
  
  const wrapStart = '{/* Content Area */}';
  const insertIdx = code.indexOf(wrapStart);
  
  if (insertIdx > -1) {
    code = code.slice(0, insertIdx) + '{/* Workspace Wrapper for Fixed UIs */}\n      <div className="flex-1 relative flex flex-col overflow-hidden">\n        ' + uiCode + '\n\n        ' + code.slice(insertIdx);
  }
  
  const botTarget = '    </div>\n  );\n};';
  let lastDiv = code.lastIndexOf(botTarget);
  if (lastDiv === -1) {
    lastDiv = code.lastIndexOf('    </div>\r\n  );\r\n};');
  }
  
  if (lastDiv > -1) {
    code = code.slice(0, lastDiv) + '      </div>\n' + code.slice(lastDiv);
    fs.writeFileSync(file, code);
    console.log('Successfully refactored UI positions to outer wrapper.');
  } else {
    console.log('Bottom target not found. Looked for:', botTarget);
  }
} else {
  console.log('UI positions not found');
}
