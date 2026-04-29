import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTask,
  toggleSubtask,
  getTaskProgress,
  resolveQuadrant,
  getRewardCoins,
  isTaskDueSoon,
} from '../src/model.js';

test('resolveQuadrant maps important/urgent flags to Eisenhower labels', () => {
  assert.equal(resolveQuadrant(true, true), 'important-urgent');
  assert.equal(resolveQuadrant(true, false), 'important-not-urgent');
  assert.equal(resolveQuadrant(false, true), 'not-important-urgent');
  assert.equal(resolveQuadrant(false, false), 'not-important-not-urgent');
});

test('createTask normalizes fields and creates subtasks from newline text', () => {
  const task = createTask({
    title: '做作品集首页',
    description: '先完成第一屏',
    important: true,
    urgent: false,
    priority: 'S',
    reminderAt: '2026-05-01T09:30',
    subtasksText: '找参考\n搭布局\n\n导出预览',
  });

  assert.equal(task.quadrant, 'important-not-urgent');
  assert.equal(task.priority, 'S');
  assert.equal(task.reminderAt, '2026-05-01T09:30');
  assert.deepEqual(task.subtasks.map((item) => item.title), ['找参考', '搭布局', '导出预览']);
  assert.ok(task.id.startsWith('task-'));
});

test('toggleSubtask updates progress and marks task complete when all subtasks are done', () => {
  const task = createTask({ title: '剪视频', important: true, urgent: true, subtasksText: '写稿\n粗剪' });
  const first = toggleSubtask(task, task.subtasks[0].id);
  assert.deepEqual(getTaskProgress(first), { done: 1, total: 2, percent: 50 });
  assert.equal(first.status, '进行中');

  const second = toggleSubtask(first, first.subtasks[1].id);
  assert.deepEqual(getTaskProgress(second), { done: 2, total: 2, percent: 100 });
  assert.equal(second.status, '已完成');
});

test('reward coins scale with priority and subtask count', () => {
  const task = createTask({ title: '重要任务', priority: 'A', subtasksText: '一\n二\n三' });
  assert.equal(getRewardCoins(task), 140);
});

test('isTaskDueSoon detects reminders within the next 24 hours', () => {
  const now = new Date('2026-04-29T10:00:00');
  assert.equal(isTaskDueSoon({ reminderAt: '2026-04-30T09:00' }, now), true);
  assert.equal(isTaskDueSoon({ reminderAt: '2026-05-02T09:00' }, now), false);
  assert.equal(isTaskDueSoon({ reminderAt: '' }, now), false);
});
