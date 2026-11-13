import { useMemo, useRef, useState } from 'react';
import { format, isToday, startOfDay } from 'date-fns';
import { useTasks } from '../context/TasksContext.jsx';
import { groupTasksByWeek, isThisWeek, summarize, tasksInWeek, tasksOnDay, weekKey } from '../lib/week.js';
import { HomeHeader } from '../components/TopBar.jsx';
import WeekStrip from '../components/WeekStrip.jsx';
import SummaryCards from '../components/SummaryCards.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import TaskRow from '../components/TaskRow.jsx';
import WeekCard from '../components/WeekCard.jsx';
import { EmptyState, ErrorState, LoadingRows } from '../components/States.jsx';

export default function Home({ selected, onSelect }) {
  const { tasks, loading, error, reload } = useTasks();
  const [expanded, setExpanded] = useState(() => new Set([weekKey(new Date())]));
  const weeksRef = useRef(null);

  const weekTasks = useMemo(() => tasksInWeek(tasks, selected), [tasks, selected]);
  const week = summarize(weekTasks);
  const dayTasks = useMemo(() => tasksOnDay(tasks, selected), [tasks, selected]);
  const weeks = useMemo(() => groupTasksByWeek(tasks), [tasks]);
  const caption = isThisWeek(selected) ? 'This Week' : `Wk of ${format(selected, 'd MMM')}`;

  const toggle = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // "View All": open the selected week's card in the weekly list and scroll to it.
  const viewAll = () => {
    const key = weekKey(selected);
    setExpanded((prev) => new Set(prev).add(key));
    requestAnimationFrame(() =>
      weeksRef.current?.querySelector(`[data-week="${key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <HomeHeader />

      <WeekStrip selected={selected} onSelect={onSelect} tasks={tasks} />

      <SummaryCards completed={week.completed} open={week.open} caption={caption} />

      <section aria-labelledby="progress-h">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="progress-h" className="text-lg font-semibold text-black">
            Weekly Progress
          </h2>
          <span className="text-xs text-subtle">
            {week.completed}/{week.total} done
          </span>
        </div>
        <ProgressBar value={week.progress} />
      </section>

      <section aria-labelledby="today-h">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="today-h" className="text-lg font-semibold text-ink">
            {isToday(selected) ? 'Tasks Today' : `Tasks · ${format(selected, 'EEE d MMM')}`}
          </h2>
          <button type="button" onClick={viewAll} className="text-sm font-medium text-primary">
            View All
          </button>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <LoadingRows />
        ) : dayTasks.length ? (
          <ul className="flex flex-col gap-4">
            {dayTasks.map((t) => (
              <TaskRow key={t._id} task={t} />
            ))}
          </ul>
        ) : (
          <EmptyState title="No tasks for this day">Tap + to add one.</EmptyState>
        )}
      </section>

      <section aria-labelledby="weeks-h" ref={weeksRef}>
        <h2 id="weeks-h" className="mb-4 text-lg font-semibold text-ink">
          All Weeks
        </h2>
        {!loading && !error && weeks.length === 0 && (
          <EmptyState title="No tasks yet">Your weeks will appear here once you add a task.</EmptyState>
        )}
        <div className="flex flex-col gap-3">
          {weeks.map((w) => (
            <WeekCard key={w.key} week={w} expanded={expanded.has(w.key)} onToggle={() => toggle(w.key)} />
          ))}
        </div>
      </section>
    </div>
  );
}

export const initialSelected = () => startOfDay(new Date());
