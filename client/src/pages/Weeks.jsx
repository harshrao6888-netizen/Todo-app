import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '../context/TasksContext.jsx';
import { groupTasksByWeek, weekKey } from '../lib/week.js';
import { BackHeader } from '../components/TopBar.jsx';
import WeekCard from '../components/WeekCard.jsx';
import { EmptyState, ErrorState, LoadingRows } from '../components/States.jsx';

/** Every week that has tasks, as expandable Mon–Sun cards. Opened from Home's "View All". */
export default function Weeks() {
  const [params] = useSearchParams();
  const focus = params.get('week') ?? weekKey(new Date());
  const { tasks, loading, error, reload } = useTasks();
  const weeks = useMemo(() => groupTasksByWeek(tasks), [tasks]);
  const [expanded, setExpanded] = useState(() => new Set([focus]));
  const listRef = useRef(null);
  const scrolled = useRef(false);

  // Bring the week picked on Home into view once its card has rendered.
  useEffect(() => {
    if (scrolled.current || loading) return;
    const card = listRef.current?.querySelector(`[data-week="${focus}"]`);
    if (card) {
      card.scrollIntoView({ block: 'start' });
      scrolled.current = true;
    }
  }, [focus, loading, weeks]);

  const toggle = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      <BackHeader title="All Weeks" />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingRows />
      ) : weeks.length === 0 ? (
        <EmptyState title="No tasks yet">Your weeks will appear here once you add a task.</EmptyState>
      ) : (
        <div ref={listRef} className="flex flex-col gap-3">
          {weeks.map((w) => (
            <WeekCard key={w.key} week={w} expanded={expanded.has(w.key)} onToggle={() => toggle(w.key)} />
          ))}
        </div>
      )}
    </div>
  );
}
