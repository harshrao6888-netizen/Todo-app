import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, startOfDay } from 'date-fns';
import { useTasks } from '../context/TasksContext.jsx';
import { isThisWeek, summarize, tasksInWeek, tasksOnDay, weekKey } from '../lib/week.js';
import { HomeHeader } from '../components/TopBar.jsx';
import WeekStrip from '../components/WeekStrip.jsx';
import SummaryCards from '../components/SummaryCards.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import TaskRow from '../components/TaskRow.jsx';
import { EmptyState, ErrorState, LoadingRows } from '../components/States.jsx';

export default function Home({ selected, onSelect }) {
  const { tasks, loading, error, reload } = useTasks();
  const navigate = useNavigate();

  const weekTasks = useMemo(() => tasksInWeek(tasks, selected), [tasks, selected]);
  const week = summarize(weekTasks);
  const dayTasks = useMemo(() => tasksOnDay(tasks, selected), [tasks, selected]);
  const caption = isThisWeek(selected) ? 'This Week' : `Wk of ${format(selected, 'd MMM')}`;

  // "View All": open the All Weeks page with the selected week expanded.
  const viewAll = () => navigate(`/weeks?week=${weekKey(selected)}`);

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
    </div>
  );
}

export const initialSelected = () => startOfDay(new Date());
