import fs from 'fs';
const file = 'e:/openhankog工作区/超级画板/--main/components/ContentArea.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `  useEffect(() => { groupRef.current = group; }, [group]);`;
const fallbackStr = `  useEffect(() => { groupRef.current = group; }, [group]);`.trim();

const extraHooks = `

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
`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, targetStr + extraHooks);
    fs.writeFileSync(file, code);
    console.log("Successfully inserted extra hooks.");
} else if (code.includes(fallbackStr)) {
    code = code.replace(fallbackStr, fallbackStr + extraHooks);
    fs.writeFileSync(file, code);
    console.log("Successfully inserted extra hooks (via fallback).");
} else {
    console.log("Error: Target string not found.");
}
