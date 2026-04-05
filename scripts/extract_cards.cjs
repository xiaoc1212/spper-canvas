const fs = require('fs');
const content = fs.readFileSync('components/ContentArea.tsx', 'utf8');

// The ItemCard component starts around "const ItemCard: React.FC<{ "
const itemCardStartTag = "export const ItemCard: React.FC<{";
let itemCardStartIndex = content.indexOf(itemCardStartTag);
if (itemCardStartIndex === -1) {
    // try old
    itemCardStartIndex = content.indexOf("const ItemCard: React.FC<{");
}
if (itemCardStartIndex === -1) throw new Error("Could not find start");

const contentAreaStartTag = "export const ContentArea: React.FC";
const contentAreaStartIndex = content.indexOf(contentAreaStartTag);
if (contentAreaStartIndex === -1) throw new Error("Could not find content area start");

// Fix: if `export const ItemCard` isn't there, we just extract from `const ItemCard` and add `export ` to it.
let itemCardChunk = content.substring(itemCardStartIndex, contentAreaStartIndex);
if (itemCardChunk.startsWith("const ")) {
    itemCardChunk = "export " + itemCardChunk;
}

const headStart = content.indexOf("// Note color presets");
const headEnd = content.indexOf("// ---- Canvas constants ----");
const headChunk = content.substring(headStart, headEnd);

const newFileContent = `
import React, { useState, useEffect } from 'react';
import { Card, ItemType } from '../types';
import { Copy, Eye, EyeOff, Plus, Trash2, Check, Terminal, Key, Type, Save, LayoutGrid, List, Sparkles, X, ArrowRight, Image as ImageIcon, StickyNote, MousePointer2, Network, GripVertical, Link2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import TextareaAutosize from 'react-textarea-autosize';

${headChunk}
${itemCardChunk}
`;

fs.writeFileSync('components/ItemCard.tsx', newFileContent);

// Modify original and remove constants as well as ItemCard
let updatedContentArea = content.substring(0, headStart) + content.substring(headEnd, itemCardStartIndex) + content.substring(contentAreaStartIndex);
updatedContentArea = "import { ItemCard } from './ItemCard';\n" + updatedContentArea;
updatedContentArea = updatedContentArea.replace(/const NOTE_COLORS.*?\n/g, ""); // if duplicates

fs.writeFileSync('components/ContentArea.tsx', updatedContentArea);
console.log("Successfully extracted ItemCard.tsx");
