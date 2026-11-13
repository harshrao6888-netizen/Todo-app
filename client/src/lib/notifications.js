import { format, isSameDay, startOfDay } from 'date-fns';

/**
 * Derive notifications from the task list. Pure function so it can be unit tested.
 *  - ended:          an open task whose end time (or start time, if no end) has passed
 *  - starting-soon:  an open task starting within `leadMinutes`
 *  - daily-summary:  how many tasks are scheduled today and how many remain
 */
export function computeNotifications(tasks, now, settings) {
  if (!settings?.notificationsEnabled) return [];
  const leadMs = (settings.leadMinutes ?? 30) * 60_000;
  const list = [];

  for (const task of tasks) {
    if (task.status === 'completed') continue;
    const start = new Date(task.startAt);
    const end = task.endAt ? new Date(task.endAt) : start;

    if (end <= now) {
      list.push({
        id: `ended:${task._id}:${end.getTime()}`,
        type: 'ended',
        taskId: task._id,
        title: 'Task time is up',
        message: `"${task.title}" ended ${format(end, "EEE d MMM, h:mm a")} and isn't completed yet.`,
        at: end,
      });
    } else if (start > now && start - now <= leadMs) {
      const mins = Math.max(1, Math.round((start - now) / 60_000));
      list.push({
        id: `soon:${task._id}:${start.getTime()}`,
        type: 'starting-soon',
        taskId: task._id,
        title: 'Starting soon',
        message: `"${task.title}" starts in ${mins} min (${format(start, 'h:mm a')}).`,
        at: new Date(start.getTime() - leadMs),
      });
    }
  }

  const today = tasks.filter((t) => isSameDay(new Date(t.startAt), now));
  if (today.length) {
    const remaining = today.filter((t) => t.status !== 'completed').length;
    list.push({
      id: `summary:${format(now, 'yyyy-MM-dd')}`,
      type: 'daily-summary',
      taskId: null,
      title: 'Today at a glance',
      message: `You have ${today.length} task${today.length === 1 ? '' : 's'} today, ${remaining} remaining.`,
      at: startOfDay(now),
    });
  }

  return list.sort((a, b) => b.at - a.at);
}
