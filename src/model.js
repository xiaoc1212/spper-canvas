export const QUADRANTS = {
  'important-urgent': { title: '重要且紧急', tone: 'danger', icon: '⚔️' },
  'important-not-urgent': { title: '重要但不紧急', tone: 'focus', icon: '🏰' },
  'not-important-urgent': { title: '不重要但紧急', tone: 'rush', icon: '⏰' },
  'not-important-not-urgent': { title: '不重要也不紧急', tone: 'idle', icon: '🌿' },
};

export const PRIORITY_COINS = { S: 100, A: 80, B: 50, C: 30 };

export function resolveQuadrant(important = false, urgent = false) {
  if (important && urgent) return 'important-urgent';
  if (important && !urgent) return 'important-not-urgent';
  if (!important && urgent) return 'not-important-urgent';
  return 'not-important-not-urgent';
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTask(input = {}) {
  const subtasks = String(input.subtasksText ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title) => ({ id: makeId('sub'), title, done: false }));

  const important = Boolean(input.important);
  const urgent = Boolean(input.urgent);

  return {
    id: input.id || makeId('task'),
    title: String(input.title || '未命名任务').trim(),
    description: String(input.description || '').trim(),
    important,
    urgent,
    quadrant: input.quadrant || resolveQuadrant(important, urgent),
    priority: ['S', 'A', 'B', 'C'].includes(input.priority) ? input.priority : 'B',
    reminderAt: input.reminderAt || '',
    status: input.status || '未开始',
    createdAt: input.createdAt || new Date().toISOString(),
    subtasks,
  };
}

export function getTaskProgress(task) {
  const total = task.subtasks?.length || 0;
  const done = task.subtasks?.filter((item) => item.done).length || 0;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function toggleSubtask(task, subtaskId) {
  const subtasks = task.subtasks.map((item) =>
    item.id === subtaskId ? { ...item, done: !item.done } : item,
  );
  const next = { ...task, subtasks };
  const progress = getTaskProgress(next);
  next.status = progress.total > 0 && progress.done === progress.total ? '已完成' : progress.done > 0 ? '进行中' : '未开始';
  return next;
}

export function getRewardCoins(task) {
  const base = PRIORITY_COINS[task.priority] ?? PRIORITY_COINS.B;
  const subtaskBonus = (task.subtasks?.length || 0) * 20;
  return base + subtaskBonus;
}

export function isTaskDueSoon(task, now = new Date()) {
  if (!task.reminderAt) return false;
  const due = new Date(task.reminderAt);
  if (Number.isNaN(due.getTime())) return false;
  const diff = due.getTime() - now.getTime();
  return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

export function serializeTasks(tasks) {
  return JSON.stringify(tasks);
}

export function parseTasks(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
