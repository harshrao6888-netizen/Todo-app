import { describe, it, expect } from 'vitest';
import { computeNotifications } from '../../src/lib/notifications.js';

const NOW = new Date(2026, 10, 12, 12, 0); // Thu 12 Nov 2026 12:00 local
const at = (h, m = 0, day = 12) => new Date(2026, 10, day, h, m).toISOString();
const t = (id, startAt, extra = {}) => ({ _id: id, title: id, startAt, endAt: null, status: 'in_progress', ...extra });
const settings = { notificationsEnabled: true, leadMinutes: 30 };

const byType = (list, type) => list.filter((n) => n.type === type).map((n) => n.taskId ?? n.id);

describe('computeNotifications', () => {
  it('flags an open task whose end time has passed', () => {
    const list = computeNotifications([t('a', at(9), { endAt: at(11) })], NOW, settings);
    expect(byType(list, 'ended')).toEqual(['a']);
  });

  it('uses the start time when no end time is set', () => {
    const list = computeNotifications([t('a', at(11, 59))], NOW, settings);
    expect(byType(list, 'ended')).toEqual(['a']);
  });

  it('does not flag a task whose end time is still in the future', () => {
    const list = computeNotifications([t('a', at(9), { endAt: at(13) })], NOW, settings);
    expect(byType(list, 'ended')).toEqual([]);
  });

  it('never flags completed tasks', () => {
    const list = computeNotifications(
      [t('a', at(9), { status: 'completed' }), t('b', at(12, 10), { status: 'completed' })],
      NOW,
      settings
    );
    expect(byType(list, 'ended')).toEqual([]);
    expect(byType(list, 'starting-soon')).toEqual([]);
  });

  it('warns about tasks starting within the lead time', () => {
    const list = computeNotifications(
      [t('soon', at(12, 20)), t('later', at(13, 0))],
      NOW,
      settings
    );
    expect(byType(list, 'starting-soon')).toEqual(['soon']);
  });

  it('respects a different lead time', () => {
    const list = computeNotifications([t('later', at(13, 0))], NOW, { ...settings, leadMinutes: 60 });
    expect(byType(list, 'starting-soon')).toEqual(['later']);
  });

  it('adds a daily summary when tasks are scheduled today', () => {
    const list = computeNotifications(
      [t('a', at(9), { status: 'completed' }), t('b', at(18)), t('c', at(9, 0, 13))],
      NOW,
      settings
    );
    const summary = list.find((n) => n.type === 'daily-summary');
    expect(summary.message).toMatch(/2 tasks today/);
    expect(summary.message).toMatch(/1 remaining/);
  });

  it('gives the ended notification a new id when the task is rescheduled', () => {
    const [a] = computeNotifications([t('a', at(9))], NOW, settings);
    const [b] = computeNotifications([t('a', at(10))], NOW, settings);
    expect(a.id).not.toBe(b.id);
  });

  it('returns nothing when notifications are disabled', () => {
    const list = computeNotifications([t('a', at(9))], NOW, { ...settings, notificationsEnabled: false });
    expect(list).toEqual([]);
  });

  it('sorts newest first', () => {
    const list = computeNotifications([t('old', at(8)), t('new', at(11))], NOW, settings);
    const ended = list.filter((n) => n.type === 'ended').map((n) => n.taskId);
    expect(ended).toEqual(['new', 'old']);
  });
});
