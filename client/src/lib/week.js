import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isSameWeek,
} from 'date-fns';

// Weeks start on Monday and end on Sunday (requirement 3.2).
const OPTS = { weekStartsOn: 1 };

export const weekStart = (date) => startOfWeek(date, OPTS);
export const weekEnd = (date) => endOfWeek(date, OPTS);
export const weekKey = (date) => format(weekStart(date), 'yyyy-MM-dd');
export const isThisWeek = (date, now = new Date()) => isSameWeek(date, now, OPTS);

export const weekDays = (date) => {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const byStart = (a, b) => new Date(a.startAt) - new Date(b.startAt);

export function summarize(tasks) {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const total = tasks.length;
  return { open: total - completed, completed, total, progress: total ? completed / total : 0 };
}

/** Group tasks into Monday–Sunday weeks (local time), oldest week first. */
export function groupTasksByWeek(tasks) {
  const map = new Map();
  for (const task of tasks) {
    const start = weekStart(new Date(task.startAt));
    const key = format(start, 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, { key, start, end: weekEnd(start), tasks: [] });
    map.get(key).tasks.push(task);
  }
  return [...map.values()]
    .sort((a, b) => a.start - b.start)
    .map((w) => {
      const tasksSorted = w.tasks.sort(byStart);
      return { ...w, tasks: tasksSorted, ...summarize(tasksSorted) };
    });
}

export const tasksInWeek = (tasks, date) => {
  const key = weekKey(date);
  return tasks.filter((t) => weekKey(new Date(t.startAt)) === key).sort(byStart);
};

export const tasksOnDay = (tasks, day) =>
  tasks.filter((t) => isSameDay(new Date(t.startAt), day)).sort(byStart);

export const formatWeekRange = (start) => {
  const end = weekEnd(start);
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${format(start, 'd')} – ${format(end, 'd MMM yyyy')}`
    : `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
};
