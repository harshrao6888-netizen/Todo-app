import { format, isSameDay } from 'date-fns';
import { formatWeekRange, isThisWeek } from '../lib/week.js';
import { Chevron } from './Icon.jsx';
import ProgressBar from './ProgressBar.jsx';
import TaskRow from './TaskRow.jsx';

/** Expandable summary card for one Monday–Sunday week (requirement 3.2). */
export default function WeekCard({ week, expanded, onToggle }) {
  const current = isThisWeek(week.start);
  const panelId = `week-${week.key}`;

  // Group the week's tasks by day for the expanded view.
  const days = [];
  for (const t of week.tasks) {
    const d = new Date(t.startAt);
    const last = days[days.length - 1];
    if (last && isSameDay(last.day, d)) last.tasks.push(t);
    else days.push({ day: d, tasks: [t] });
  }

  return (
    <section
      className={`border bg-canvas ${current ? 'border-primary' : 'border-line'}`}
      data-testid="week-card"
      data-week={week.key}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full flex-col gap-3 p-4 text-left"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">
              {formatWeekRange(week.start)}
            </p>
            <p className="text-[11px] text-subtle">
              {current ? 'This week' : `Week of ${format(week.start, 'EEE d MMM')}`} · Mon – Sun
            </p>
          </div>
          <Chevron direction={expanded ? 'up' : 'down'} size={18} />
        </div>
        <div className="grid w-full grid-cols-2 gap-2">
          <div className="bg-pending px-3 py-2">
            <p className="text-[10px] text-subtle">Open Tasks</p>
            <p className="text-lg font-semibold text-ink" data-testid="week-open">{week.open}</p>
          </div>
          <div className="bg-complete px-3 py-2">
            <p className="text-[10px] text-subtle">Completed Tasks</p>
            <p className="text-lg font-semibold text-ink" data-testid="week-completed">{week.completed}</p>
          </div>
        </div>
        <ProgressBar value={week.progress} height={6} label={`Progress for ${formatWeekRange(week.start)}`} />
      </button>

      {expanded && (
        <div id={panelId} className="border-t border-line px-4 pt-3 pb-1">
          {days.map(({ day, tasks }) => (
            <div key={day.toISOString()} className="mb-2">
              <p className="mb-2 text-xs font-medium text-muted">{format(day, 'EEEE d MMM')}</p>
              <ul className="flex flex-col gap-4">
                {tasks.map((t) => (
                  <TaskRow key={t._id} task={t} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
