import { describe, it, expect } from 'vitest';
import {
  weekStart,
  weekEnd,
  weekKey,
  weekDays,
  groupTasksByWeek,
  summarize,
  tasksOnDay,
} from '../../src/lib/week.js';

// Local-time constructor helper: d(2026, 11, 12, 10) = 12 Nov 2026 10:00 local
const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const task = (id, date, status = 'in_progress') => ({ _id: id, title: id, startAt: date.toISOString(), status });

describe('weekStart / weekEnd (Monday–Sunday)', () => {
  it('a Wednesday belongs to the week starting the previous Monday', () => {
    expect(weekStart(d(2026, 11, 11, 15))).toEqual(d(2026, 11, 9));
  });

  it('Monday 00:00 starts a new week', () => {
    expect(weekStart(d(2026, 11, 16, 0, 0))).toEqual(d(2026, 11, 16));
  });

  it('Sunday 23:59 still belongs to the week that started on Monday', () => {
    expect(weekStart(d(2026, 11, 15, 23, 59))).toEqual(d(2026, 11, 9));
  });

  it('week end is the last moment of Sunday', () => {
    const end = weekEnd(d(2026, 11, 11));
    expect(end.getDay()).toBe(0);
    expect(end).toEqual(new Date(2026, 10, 15, 23, 59, 59, 999));
  });

  it('weeks can span a year boundary', () => {
    // 1 Jan 2027 is a Friday -> week starts Mon 28 Dec 2026
    expect(weekStart(d(2027, 1, 1))).toEqual(d(2026, 12, 28));
  });
});

describe('weekDays', () => {
  it('returns Monday..Sunday', () => {
    const days = weekDays(d(2026, 11, 12));
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual(d(2026, 11, 9));
    expect(days[6]).toEqual(d(2026, 11, 15));
    expect(days.map((x) => x.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe('groupTasksByWeek', () => {
  it('groups tasks into Monday-start weeks sorted chronologically', () => {
    const tasks = [
      task('sun-late', d(2026, 11, 15, 23, 59)),
      task('mon-next', d(2026, 11, 16, 0, 0), 'completed'),
      task('wed', d(2026, 11, 11, 9)),
      task('prev', d(2026, 11, 3, 9)),
    ];
    const weeks = groupTasksByWeek(tasks);
    expect(weeks.map((w) => w.key)).toEqual([
      weekKey(d(2026, 11, 2)),
      weekKey(d(2026, 11, 9)),
      weekKey(d(2026, 11, 16)),
    ]);
    expect(weeks[1].tasks.map((t) => t._id)).toEqual(['wed', 'sun-late']);
    expect(weeks[2]).toMatchObject({ open: 0, completed: 1, total: 1 });
    expect(weeks[1]).toMatchObject({ open: 2, completed: 0, total: 2 });
  });

  it('returns an empty list for no tasks', () => {
    expect(groupTasksByWeek([])).toEqual([]);
  });
});

describe('summarize', () => {
  it('counts open vs completed and progress', () => {
    const s = summarize([
      task('a', d(2026, 11, 9), 'completed'),
      task('b', d(2026, 11, 9)),
      task('c', d(2026, 11, 9)),
      task('d', d(2026, 11, 9), 'completed'),
    ]);
    expect(s).toEqual({ open: 2, completed: 2, total: 4, progress: 0.5 });
  });

  it('progress is 0 with no tasks', () => {
    expect(summarize([]).progress).toBe(0);
  });
});

describe('tasksOnDay', () => {
  it('returns tasks that start on the given local day, sorted by time', () => {
    const tasks = [
      task('late', d(2026, 11, 12, 18)),
      task('other', d(2026, 11, 13, 1)),
      task('early', d(2026, 11, 12, 7)),
    ];
    expect(tasksOnDay(tasks, d(2026, 11, 12)).map((t) => t._id)).toEqual(['early', 'late']);
  });
});
