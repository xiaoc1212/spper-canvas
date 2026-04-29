import {
  QUADRANTS,
  createTask,
  getRewardCoins,
  getTaskProgress,
  isTaskDueSoon,
  parseTasks,
  resolveQuadrant,
  serializeTasks,
  toggleSubtask,
} from './model.js';

const STORAGE_KEY = 'quadrant-quest-board-v1';
const board = document.querySelector('#board');
const form = document.querySelector('#taskForm');
const toast = document.querySelector('#toast');
const coinCount = document.querySelector('#coinCount');
const doneCount = document.querySelector('#doneCount');
const dueCount = document.querySelector('#dueCount');

let tasks = loadTasks();
let openTaskId = tasks[0]?.id ?? null;
let coins = Number(localStorage.getItem(`${STORAGE_KEY}:coins`) || 0);

function loadTasks() {
  const saved = parseTasks(localStorage.getItem(STORAGE_KEY));
  if (saved.length) return saved;
  return [
    createTask({
      title: '启动今天的主线任务',
      description: '选一个真正推动现状的任务，先做最小一步。',
      important: true,
      urgent: true,
      priority: 'A',
      subtasksText: '确定今天主任务\n拆出 3 个小动作\n完成第一个动作',
    }),
    createTask({
      title: '整理灵感库存',
      description: '把散乱想法先收进仓库，不急着开工。',
      important: false,
      urgent: false,
      priority: 'C',
      subtasksText: '收集零散想法\n标出可延后项',
    }),
  ];
}

function save() {
  localStorage.setItem(STORAGE_KEY, serializeTasks(tasks));
  localStorage.setItem(`${STORAGE_KEY}:coins`, String(coins));
}

function render() {
  board.innerHTML = '';
  Object.entries(QUADRANTS).forEach(([key, config]) => {
    const node = document.querySelector('#quadrantTemplate').content.firstElementChild.cloneNode(true);
    node.classList.add(config.tone);
    node.querySelector('.q-icon').textContent = config.icon;
    node.querySelector('h2').textContent = config.title;
    node.querySelector('p').textContent = getQuadrantHint(key);
    const list = node.querySelector('.task-list');
    const currentTasks = tasks.filter((task) => task.quadrant === key);
    if (!currentTasks.length) {
      list.innerHTML = '<div class="empty-slot">这里暂时没有怪物任务</div>';
    } else {
      currentTasks.sort(sortTasks).forEach((task) => list.appendChild(renderTask(task)));
    }
    board.appendChild(node);
  });
  renderHud();
  save();
}

function sortTasks(a, b) {
  const weight = { S: 4, A: 3, B: 2, C: 1 };
  return (weight[b.priority] ?? 0) - (weight[a.priority] ?? 0) || a.createdAt.localeCompare(b.createdAt);
}

function getQuadrantHint(key) {
  return {
    'important-urgent': '立刻开打，别拖。',
    'important-not-urgent': '主线养成，每天推进。',
    'not-important-urgent': '快速处理或外包。',
    'not-important-not-urgent': '放仓库，少占脑子。',
  }[key];
}

function renderTask(task) {
  const node = document.querySelector('#taskTemplate').content.firstElementChild.cloneNode(true);
  const progress = getTaskProgress(task);
  node.classList.toggle('open', task.id === openTaskId);
  node.classList.toggle('done', task.status === '已完成');
  node.classList.toggle('due-soon', isTaskDueSoon(task));
  node.querySelector('strong').textContent = task.title;
  node.querySelector('.priority').textContent = `${task.priority}级`;
  node.querySelector('.desc').textContent = task.description || '没有说明，直接开始。';
  node.querySelector('.progress span').style.width = `${progress.percent}%`;
  node.querySelector('.meta').innerHTML = `${progress.done}/${progress.total || 1} 步 · ${task.status} · 奖励 ${getRewardCoins(task)}🪙 ${task.reminderAt ? `· 🔔 ${task.reminderAt.replace('T', ' ')}` : ''}`;
  node.querySelector('.task-main').addEventListener('click', () => {
    openTaskId = openTaskId === task.id ? null : task.id;
    pulse(node);
    render();
  });
  node.querySelector('.task-detail').appendChild(renderDetail(task));
  return node;
}

function renderDetail(task) {
  const wrap = document.createElement('div');
  wrap.className = 'detail-inner';
  const subList = document.createElement('div');
  subList.className = 'subtasks';
  if (!task.subtasks.length) {
    subList.innerHTML = '<p class="empty-detail">没有子任务：这张卡可以直接完成。</p>';
  }
  task.subtasks.forEach((subtask) => {
    const label = document.createElement('label');
    label.className = `subtask ${subtask.done ? 'checked' : ''}`;
    label.innerHTML = `<input type="checkbox" ${subtask.done ? 'checked' : ''} /> <span>${subtask.title}</span>`;
    label.querySelector('input').addEventListener('change', () => {
      const before = task.status;
      tasks = tasks.map((item) => (item.id === task.id ? toggleSubtask(item, subtask.id) : item));
      const updated = tasks.find((item) => item.id === task.id);
      if (before !== '已完成' && updated.status === '已完成') {
        coins += getRewardCoins(updated);
        showToast(`任务完成！获得 ${getRewardCoins(updated)} 金币 🪙`);
      } else {
        showToast('子任务推进 +1 ⚡');
      }
      render();
    });
    subList.appendChild(label);
  });

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = '<button type="button" data-action="start">设为进行中</button><button type="button" data-action="delete">删除</button>';
  actions.querySelector('[data-action="start"]').addEventListener('click', () => {
    tasks = tasks.map((item) => (item.id === task.id ? { ...item, status: '进行中' } : item));
    showToast('已进入战斗状态 ⚔️');
    render();
  });
  actions.querySelector('[data-action="delete"]').addEventListener('click', () => {
    tasks = tasks.filter((item) => item.id !== task.id);
    showToast('任务已移出任务盘');
    render();
  });
  wrap.append(subList, actions);
  return wrap;
}

function renderHud() {
  coinCount.textContent = coins;
  doneCount.textContent = tasks.filter((task) => task.status === '已完成').length;
  dueCount.textContent = tasks.filter((task) => isTaskDueSoon(task)).length;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const task = createTask({
    ...data,
    important: data.important === 'on',
    urgent: data.urgent === 'on',
    quadrant: resolveQuadrant(data.important === 'on', data.urgent === 'on'),
  });
  tasks = [task, ...tasks];
  openTaskId = task.id;
  form.reset();
  form.elements.important.checked = true;
  form.elements.priority.value = 'A';
  showToast('新任务入场！');
  render();
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1600);
}

function pulse(element) {
  element.animate(
    [
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(.98)', filter: 'brightness(1.5)' },
      { transform: 'scale(1)', filter: 'brightness(1)' },
    ],
    { duration: 180, easing: 'cubic-bezier(.2, 1.8, .2, 1)' },
  );
}

render();
