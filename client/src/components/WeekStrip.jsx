import { addWeeks, format, isSameDay, isToday } from 'date-fns';
import { weekDays } from '../lib/week.js';
import { Chevron } from './Icon.jsx';

/** Figma "Calendar" strip — Monday to Sunday, with arrows to move between weeks. */
export default function WeekStrip({ selected, onSelect, tasks }) {
  const days = weekDays(selected);
  const hasTasks = (day) => tasks.some((t) => isSameDay(new Date(t.startAt), day));

  const shift = (n) => onSelect(addWeeks(selected, n));

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous week"
        onClick={() => shift(-1)}
        className="flex h-[63px] w-5 shrink-0 items-center justify-center"
      >
        <Chevron direction="left" size={18} />
      </button>
      <ol className="grid flex-1 grid-cols-7">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          return (
            <li key={day.toISOString()} className="flex justify-center">
              <button
                type="button"
                onClick={() => onSelect(day)}
                aria-pressed={active}
                aria-label={format(day, 'EEEE d MMMM')}
                className={`flex h-[63px] min-w-[38px] flex-col items-center justify-start px-2 pt-1.5 ${
                  active ? 'bg-primary text-white' : isToday(day) ? 'text-primary' : 'text-faint'
                }`}
              >
                <span className="text-[10px] leading-[22px]">{format(day, 'EEE')}</span>
                <span className="text-sm leading-[22px] font-medium">{format(day, 'dd')}</span>
                {hasTasks(day) && (
                  <span
                    className={`mt-0.5 size-1 rounded-full ${active ? 'bg-white' : 'bg-primary'}`}
                    aria-label="has tasks"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        aria-label="Next week"
        onClick={() => shift(1)}
        className="flex h-[63px] w-5 shrink-0 items-center justify-center"
      >
        <Chevron direction="right" size={18} />
      </button>
    </div>
  );
}
