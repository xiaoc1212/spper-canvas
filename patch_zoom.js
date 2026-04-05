import fs from 'fs';
const file = 'e:/openhankog工作区/超级画板/--main/components/ContentArea.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Insert handleZoomCenter
const hookTarget = `  useEffect(() => {\r\n    canvasScaleRef.current = canvasScale;\r\n  }, [canvasScale]);`;
const fallbackHookTarget = `  useEffect(() => {\n    canvasScaleRef.current = canvasScale;\n  }, [canvasScale]);`;

const newZoomFunc = `\n\n  const handleZoomCenter = (newScale: number) => {\n    const container = outerScrollRef.current;\n    if (!container) {\n        setCanvasScale(newScale);\n        return;\n    }\n\n    const { scrollLeft, scrollTop, clientWidth, clientHeight } = container;\n    const oldScale = canvasScaleRef.current;\n    \n    const centerXStart = (scrollLeft + clientWidth / 2) / oldScale;\n    const centerYStart = (scrollTop + clientHeight / 2) / oldScale;\n\n    setCanvasScale(newScale);\n\n    requestAnimationFrame(() => {\n        if (!outerScrollRef.current) return;\n        const targetScrollLeft = centerXStart * newScale - clientWidth / 2;\n        const targetScrollTop = centerYStart * newScale - clientHeight / 2;\n        \n        outerScrollRef.current.scrollLeft = targetScrollLeft;\n        outerScrollRef.current.scrollTop = targetScrollTop;\n    });\n  };\n`;

if (code.includes(hookTarget)) {
    code = code.replace(hookTarget, hookTarget + newZoomFunc);
} else if (code.includes(fallbackHookTarget)) {
    code = code.replace(fallbackHookTarget, fallbackHookTarget + newZoomFunc);
} else {
    console.warn("Could not find hookTarget");
}

// 2. Replace setCanvasScale with handleZoomCenter in Zoom controls
// Only in the specific block, we map the 3 instances
const zoomCtrlStart = '{/* Zoom Controls */}';
const zoomCtrlEnd = '</>'; // or just string replace `setCanvasScale` -> `handleZoomCenter` locally
const idx1 = code.indexOf(zoomCtrlStart);
if (idx1 > -1) {
    let before = code.substring(0, idx1);
    let after = code.substring(idx1);
    // There are 3 setCanvasScale calls in here
    after = after.replace('setCanvasScale(Math.max(MIN_SCALE', 'handleZoomCenter(Math.max(MIN_SCALE');
    after = after.replace('setCanvasScale(1)', 'handleZoomCenter(1)');
    after = after.replace('setCanvasScale(Math.min(MAX_SCALE', 'handleZoomCenter(Math.min(MAX_SCALE');
    code = before + after;
    
    fs.writeFileSync(file, code);
    console.log("Successfully replaced zoom controls.");
} else {
    console.log("Could not find Zoom Controls block.");
}
